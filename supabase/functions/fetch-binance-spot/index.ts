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
      headers: { 
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      } 
    })
  }

  try {
    console.log('Starting Binance spot balance fetch...')
    
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
      console.error('User authentication error:', userError)
      throw userError || new Error('User not found')
    }

    console.log('Authenticated user:', user.id)

    const apiKey = Deno.env.get('BINANCE_API_KEY')
    const apiSecret = Deno.env.get('BINANCE_API_SECRET')

    if (!apiKey || !apiSecret) {
      console.error('Missing Binance API credentials')
      throw new Error('Missing Binance API credentials')
    }

    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = await cryptoSign(queryString, apiSecret)

    console.log('Making request to Binance API...')
    
    const response = await fetch(
      `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
          'User-Agent': 'Mozilla/5.0',
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

    // Filter and return balances
    const balances = data.balances.filter((balance: any) => 
      parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
    )

    console.log(`Found ${balances.length} non-zero balances`)

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