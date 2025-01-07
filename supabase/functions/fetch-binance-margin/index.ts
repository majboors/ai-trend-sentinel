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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting Binance isolated margin balance fetch...')
    
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

    // Initialize Supabase client with service role key for admin access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
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

    console.log('Making request to Binance API for isolated margin account...')
    
    const response = await fetch(
      `https://api.binance.com/sapi/v1/margin/isolated/account?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': binanceApiKey,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Binance API error:', errorData)
      
      // Return empty array if margin account is not found or not enabled
      if (response.status === 404) {
        console.log('Margin account not found or not enabled, returning empty array')
        return new Response(
          JSON.stringify([]),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
      
      throw new Error(`Binance API error: ${errorData}`)
    }

    const data = await response.json()
    console.log('Successfully received Binance isolated margin response')

    // Process isolated margin assets
    const userAssets: any[] = [];
    if (data.assets) {
      for (const asset of data.assets) {
        // Process base asset
        const baseAsset = {
          asset: asset.baseAsset.asset,
          free: parseFloat(asset.baseAsset.free),
          locked: parseFloat(asset.baseAsset.locked),
        };
        if (baseAsset.free > 0 || baseAsset.locked > 0) {
          userAssets.push(baseAsset);
        }

        // Process quote asset
        const quoteAsset = {
          asset: asset.quoteAsset.asset,
          free: parseFloat(asset.quoteAsset.free),
          locked: parseFloat(asset.quoteAsset.locked),
        };
        if (quoteAsset.free > 0 || quoteAsset.locked > 0) {
          userAssets.push(quoteAsset);
        }
      }
    }

    console.log(`Found ${userAssets.length} non-zero isolated margin balances`)

    // Store in database
    for (const asset of userAssets) {
      const { error: upsertError } = await supabaseAdmin
        .from('assets')
        .upsert({
          user_id: user.id,
          symbol: asset.asset,
          free: asset.free,
          locked: asset.locked,
          account_type: 'margin',
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id,symbol,account_type'
        })

      if (upsertError) {
        console.error('Error upserting margin asset:', upsertError)
        throw upsertError
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