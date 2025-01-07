import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchSpotPairs() {
  console.log('Fetching spot trading pairs...');
  const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
  const data = await response.json();
  
  const pairs = new Set();
  data.symbols
    .filter((s: any) => s.status === 'TRADING' && s.isSpotTradingAllowed)
    .forEach((symbol: any) => {
      pairs.add({
        symbol: symbol.baseAsset,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        profit: Math.random() > 0.5, // Temporary random profit for demo
        priceChangePercent: (Math.random() * 10 - 5).toFixed(2), // Random price change
        lastPrice: (Math.random() * 1000).toFixed(2), // Random price
        volume: (Math.random() * 1000000).toFixed(2), // Random volume
        quoteVolume: (Math.random() * 1000000).toFixed(2), // Random quote volume
      });
    });
  
  return Array.from(pairs);
}

async function fetch24hrTickers() {
  console.log('Fetching 24hr tickers...');
  const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
  const tickers = await response.json();
  return tickers.reduce((acc: any, ticker: any) => {
    acc[ticker.symbol] = ticker;
    return acc;
  }, {});
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Fetching all trading pairs for user:', user.id);
    
    const [spotPairs, tickers] = await Promise.all([
      fetchSpotPairs(),
      fetch24hrTickers(),
    ]);

    console.log(`Total unique trading pairs found: ${spotPairs.length}`);
    console.log('Sample of pairs:', spotPairs.slice(0, 5));

    return new Response(
      JSON.stringify(spotPairs),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in fetch-binance-pairs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});