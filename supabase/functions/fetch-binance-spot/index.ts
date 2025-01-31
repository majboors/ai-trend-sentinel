import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          message: 'Please sign in to access this resource',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Fetching API keys for user:', user.id)

    // Get the user's Binance API keys
    const { data: apiKeys, error: apiKeysError } = await supabaseClient
      .from('api_keys')
      .select('binance_api_key, binance_api_secret')
      .eq('user_id', user.id)
      .maybeSingle()

    if (apiKeysError) {
      console.error('Database error fetching API keys:', apiKeysError)
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Failed to fetch API keys from database',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!apiKeys) {
      console.log('No API keys found for user:', user.id)
      return new Response(
        JSON.stringify({
          error: 'No API keys found',
          message: 'Please add your Binance API keys in the settings',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create signature for Binance API request
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(apiKeys.binance_api_secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(queryString)
    )

    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('Fetching Binance spot account data...')
    
    // Make request to Binance API
    const response = await fetch(
      `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKeys.binance_api_key,
        },
      }
    )

    if (!response.ok) {
      const responseText = await response.text()
      console.error('Binance API error:', response.status, responseText)
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({
            error: 'Invalid API keys',
            message: 'Please check your Binance API keys',
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({
          error: 'Binance API error',
          message: `HTTP error! status: ${response.status}`,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await response.json()
    
    // Filter out zero balances
    const balances = data.balances.filter(
      (balance: any) =>
        parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
    )

    console.log('Successfully fetched spot balances')
    
    return new Response(
      JSON.stringify(balances),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in fetch-binance-spot:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})