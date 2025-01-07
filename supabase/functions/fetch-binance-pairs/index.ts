import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      console.error('Authentication error:', userError);
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
    console.log('Fetching exchange info...');
    const exchangeInfoResponse = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    if (!exchangeInfoResponse.ok) {
      console.error('Failed to fetch exchange info:', exchangeInfoResponse.statusText);
      throw new Error(`Failed to fetch exchange info: ${exchangeInfoResponse.statusText}`);
    }
    const exchangeInfo = await exchangeInfoResponse.json();
    console.log('Exchange info fetched successfully');
    
    // Fetch 24hr ticker price changes
    console.log('Fetching ticker data...');
    const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!tickerResponse.ok) {
      console.error('Failed to fetch ticker data:', tickerResponse.statusText);
      throw new Error(`Failed to fetch ticker data: ${tickerResponse.statusText}`);
    }
    const tickerData = await tickerResponse.json();
    console.log('Ticker data fetched successfully');

    // Create a map of ticker data for quick lookup
    const tickerMap = new Map(
      tickerData.map((ticker: any) => [ticker.symbol, ticker])
    );

    // Process and filter trading pairs
    console.log('Processing trading pairs...');
    const tradingPairs = exchangeInfo.symbols
      .filter((symbol: any) => 
        symbol.status === 'TRADING' && 
        symbol.isSpotTradingAllowed
      )
      .map((symbol: any) => {
        const ticker = tickerMap.get(symbol.symbol);
        if (!ticker) {
          console.log(`No ticker data found for symbol: ${symbol.symbol}`);
          return null;
        }

        return {
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          priceChange: parseFloat(ticker.priceChange),
          priceChangePercent: parseFloat(ticker.priceChangePercent),
          lastPrice: parseFloat(ticker.lastPrice),
          volume: parseFloat(ticker.volume),
          quoteVolume: parseFloat(ticker.quoteVolume),
          profit: parseFloat(ticker.priceChangePercent) > 0
        };
      })
      .filter(Boolean); // Remove null values

    console.log(`Found ${tradingPairs.length} active trading pairs`);
    console.log('Sample trading pair:', tradingPairs[0]);

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