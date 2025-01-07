import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Fetching trading pairs for user:', user.id);
    
    // Fetch exchange information from Binance
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange info: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Fetch 24hr ticker price change
    const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!tickerResponse.ok) {
      throw new Error(`Failed to fetch ticker data: ${tickerResponse.statusText}`);
    }
    const tickerData = await tickerResponse.json();

    // Create a map of ticker data for quick lookup
    const tickerMap = new Map(
      tickerData.map((ticker: any) => [ticker.symbol, ticker])
    );

    // Process trading pairs
    const tradingPairs = data.symbols
      .filter((symbol: any) => 
        symbol.status === 'TRADING' && 
        symbol.isSpotTradingAllowed
      )
      .map((symbol: any) => {
        const ticker = tickerMap.get(symbol.symbol);
        return {
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          priceChange: ticker ? parseFloat(ticker.priceChange) : 0,
          priceChangePercent: ticker ? parseFloat(ticker.priceChangePercent) : 0,
          lastPrice: ticker ? parseFloat(ticker.lastPrice) : 0,
          volume: ticker ? parseFloat(ticker.volume) : 0,
          quoteVolume: ticker ? parseFloat(ticker.quoteVolume) : 0,
          profit: ticker ? parseFloat(ticker.priceChangePercent) > 0 : false
        };
      });

    console.log(`Found ${tradingPairs.length} trading pairs`);
    console.log('Sample pairs:', tradingPairs.slice(0, 5));

    return new Response(
      JSON.stringify(tradingPairs),
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