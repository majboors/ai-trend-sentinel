import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHALE_THRESHOLD = 100000; // $100k USD threshold for whale trades

// Singapore proxy configuration
const PROXY_URL = 'https://api.binance.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Initializing Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    console.log('Authenticating user...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Authentication failed:', userError);
      throw new Error('Unauthorized');
    }

    console.log('Fetching API keys for user:', user.id);
    // Get user's API keys
    const { data: apiKeys, error: apiKeysError } = await supabaseClient
      .from('api_keys')
      .select('binance_api_key, binance_api_secret')
      .eq('user_id', user.id)
      .single();

    if (apiKeysError || !apiKeys) {
      console.error('API keys not found:', apiKeysError);
      throw new Error('API keys not found');
    }

    // Fetch exchange info from Binance through Singapore proxy
    console.log('Fetching exchange info from Binance...');
    const exchangeInfo = await fetch(`${PROXY_URL}/api/v3/exchangeInfo`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!exchangeInfo.ok) {
      console.error('Failed to fetch exchange info:', await exchangeInfo.text());
      throw new Error('Failed to fetch exchange info');
    }

    const exchangeData = await exchangeInfo.json();
    console.log('Exchange info received, processing symbols...');
    
    // Get USDT trading pairs
    const usdtPairs = exchangeData.symbols
      .filter((s: any) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map((s: any) => s.symbol);

    console.log(`Found ${usdtPairs.length} USDT trading pairs`);

    const whales: any[] = [];
    
    // Fetch recent trades for each pair
    console.log('Fetching trades for USDT pairs...');
    for (const symbol of usdtPairs.slice(0, 10)) { // Limit to 10 pairs for rate limiting
      try {
        console.log(`Fetching trades for ${symbol}...`);
        const trades = await fetch(
          `${PROXY_URL}/api/v3/trades?symbol=${symbol}&limit=1000`,
          {
            headers: {
              'X-MBX-APIKEY': apiKeys.binance_api_key,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/json',
            },
          }
        );
        
        if (!trades.ok) {
          console.error(`Failed to fetch trades for ${symbol}:`, await trades.text());
          continue;
        }

        const tradeData = await trades.json();
        console.log(`Received ${tradeData.length} trades for ${symbol}`);
        
        // Filter for whale trades
        const whaleTrades = tradeData.filter((trade: any) => {
          const value = parseFloat(trade.price) * parseFloat(trade.qty);
          return value >= WHALE_THRESHOLD;
        });

        console.log(`Found ${whaleTrades.length} whale trades for ${symbol}`);

        // Process and store whale trades
        for (const trade of whaleTrades) {
          const tradeValue = parseFloat(trade.price) * parseFloat(trade.qty);
          
          const { error: insertError } = await supabaseClient
            .from('whale_trades')
            .upsert({
              user_id: user.id,
              symbol: symbol,
              amount: tradeValue,
              price: parseFloat(trade.price),
              trade_type: trade.isBuyerMaker ? 'buy' : 'sell',
              timestamp: new Date(trade.time).toISOString(),
            });

          if (insertError) {
            console.error('Error inserting whale trade:', insertError);
          } else {
            console.log(`Successfully inserted whale trade for ${symbol}`);
          }
        }

        whales.push(...whaleTrades);
      } catch (error) {
        console.error(`Error fetching trades for ${symbol}:`, error);
      }
    }

    console.log(`Completed processing whale trades. Total whales found: ${whales.length}`);
    return new Response(
      JSON.stringify({ success: true, whales }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in fetch-binance-whales:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});