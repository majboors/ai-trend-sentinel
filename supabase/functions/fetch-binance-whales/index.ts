import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHALE_THRESHOLD = 100000; // $100k USD threshold for whale trades

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    // Get user's API keys
    const { data: apiKeys, error: apiKeysError } = await supabaseClient
      .from('api_keys')
      .select('binance_api_key, binance_api_secret')
      .eq('user_id', user.id)
      .single();

    if (apiKeysError || !apiKeys) throw new Error('API keys not found');

    // Fetch exchange info from Binance
    const exchangeInfo = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    const exchangeData = await exchangeInfo.json();
    
    // Get USDT trading pairs
    const usdtPairs = exchangeData.symbols
      .filter((s: any) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map((s: any) => s.symbol);

    const whales: any[] = [];
    
    // Fetch recent trades for each pair
    for (const symbol of usdtPairs.slice(0, 10)) { // Limit to 10 pairs for rate limiting
      try {
        const trades = await fetch(
          `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=1000`,
          {
            headers: {
              'X-MBX-APIKEY': apiKeys.binance_api_key,
            },
          }
        );
        
        const tradeData = await trades.json();
        
        // Filter for whale trades
        const whaleTrades = tradeData.filter((trade: any) => {
          const value = parseFloat(trade.price) * parseFloat(trade.qty);
          return value >= WHALE_THRESHOLD;
        });

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

          if (insertError) console.error('Error inserting whale trade:', insertError);
        }

        whales.push(...whaleTrades);
      } catch (error) {
        console.error(`Error fetching trades for ${symbol}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, whales }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-binance-whales:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});