import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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
    return new Response(null, { 
      headers: corsHeaders
    })
  }

  try {
    console.log('Starting Binance spot balance fetch...')
    
    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const binanceApiKey = Deno.env.get('BINANCE_API_KEY')
    const binanceApiSecret = Deno.env.get('BINANCE_API_SECRET')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase credentials')
      throw new Error('Missing Supabase credentials')
    }

    if (!binanceApiKey || !binanceApiSecret) {
      console.error('Missing Binance API credentials')
      throw new Error('Missing Binance API credentials')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)
    
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
      console.error('User authentication error:', userError)
      throw userError || new Error('User not found')
    }

    console.log('Authenticated user:', user.id)

    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = await cryptoSign(queryString, binanceApiSecret)

    console.log('Making request to Binance API...')
    
    const response = await fetch(
      `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': binanceApiKey,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Binance API error:', errorText)
      throw new Error(`Binance API error: ${errorText}`)
    }

    const data = await response.json()
    console.log('Successfully received Binance response')

    // Filter and store balances
    const balances = data.balances.filter((balance: any) => 
      parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
    )

    console.log(`Found ${balances.length} non-zero balances`)

    // Store in database
    for (const balance of balances) {
      const { error: upsertError } = await supabaseClient
        .from('assets')
        .upsert({
          user_id: user.id,
          symbol: balance.asset,
          free: parseFloat(balance.free),
          locked: parseFloat(balance.locked),
          account_type: 'spot',
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id,symbol,account_type'
        })

      if (upsertError) {
        console.error('Error upserting balance:', upsertError)
        throw upsertError
      }
    }

    return new Response(
      JSON.stringify(balances),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})