import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const cryptoSign = async (message: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  )
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw userError || new Error('User not found')
    }

    console.log('Authenticated user:', user.id)

    const apiKey = Deno.env.get('BINANCE_API_KEY')
    const apiSecret = Deno.env.get('BINANCE_API_SECRET')

    if (!apiKey || !apiSecret) {
      throw new Error('Missing API credentials')
    }

    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = await cryptoSign(queryString, apiSecret)

    const response = await fetch(
      `https://api.binance.com/sapi/v1/margin/account?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Binance API error:', errorData)
      throw new Error(`Binance API error: ${errorData}`)
    }

    const data = await response.json()

    // Store balances in the database
    const userAssets = data.userAssets.filter((asset: any) => 
      parseFloat(asset.free) > 0 || parseFloat(asset.locked) > 0
    )

    for (const asset of userAssets) {
      const { error: upsertError } = await supabaseClient
        .from('assets')
        .upsert({
          user_id: user.id,
          symbol: asset.asset,
          free: asset.free,
          locked: asset.locked,
          account_type: 'margin',
        }, {
          onConflict: 'user_id,symbol,account_type'
        })

      if (upsertError) {
        console.error('Error upserting balance:', upsertError)
      }
    }

    return new Response(
      JSON.stringify(userAssets),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})