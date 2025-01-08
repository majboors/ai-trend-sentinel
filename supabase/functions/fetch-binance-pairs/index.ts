import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Starting fetch-binance-pairs function...');
    
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
    
    try {
      // Fetch exchange information from Binance with proper error handling
      console.log('Fetching exchange info...');
      const exchangeInfoResponse = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Supabase Edge Function'
        }
      });
      
      if (!exchangeInfoResponse.ok) {
        console.error('Exchange info response not OK:', exchangeInfoResponse.status);
        throw new Error(`Failed to fetch exchange info: ${exchangeInfoResponse.statusText}`);
      }
      
      const exchangeInfo = await exchangeInfoResponse.json();
      
      // Fetch 24hr ticker price changes with proper error handling
      console.log('Fetching ticker data...');
      const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Supabase Edge Function'
        }
      });
      
      if (!tickerResponse.ok) {
        console.error('Ticker response not OK:', tickerResponse.status);
        throw new Error(`Failed to fetch ticker data: ${tickerResponse.statusText}`);
      }
      
      const tickerData = await tickerResponse.json();

      // Create a map of ticker data for quick lookup
      const tickerMap = new Map(
        tickerData.map((ticker: any) => [ticker.symbol, ticker])
      );

      // Process and filter trading pairs
      const tradingPairs = exchangeInfo.symbols
        .filter((symbol: any) => 
          symbol.status === 'TRADING' && 
          symbol.isSpotTradingAllowed
        )
        .map((symbol: any) => {
          const ticker = tickerMap.get(symbol.symbol);
          if (!ticker) return null;

          const highPrice = parseFloat(ticker.highPrice);
          const lowPrice = parseFloat(ticker.lowPrice);
          const avgPrice = (highPrice + lowPrice) / 2;
          const volatility = ((highPrice - lowPrice) / avgPrice) * 100;

          // Generate mock klines data for testing
          const klines = Array.from({ length: 100 }, (_, i) => {
            const timestamp = Date.now() - (99 - i) * 60 * 60 * 1000;
            const basePrice = parseFloat(ticker.lastPrice);
            const trend = Math.sin(i / 10) * 0.02;
            const noise = (Math.random() - 0.5) * 0.01;
            const price = basePrice * (1 + trend + noise);
            
            return {
              openTime: timestamp,
              open: price.toString(),
              high: (price * 1.002).toString(),
              low: (price * 0.998).toString(),
              close: price.toString(),
              volume: (parseFloat(ticker.volume) * (Math.random() * 0.5 + 0.75)).toString()
            };
          });

          // Generate mock recent trades data
          const recentTrades = Array.from({ length: 20 }, () => ({
            time: Date.now() - Math.floor(Math.random() * 3600000),
            price: (parseFloat(ticker.lastPrice) * (1 + (Math.random() - 0.5) * 0.002)).toString(),
            quantity: (Math.random() * 100).toString(),
            isBuyerMaker: Math.random() > 0.5
          }));

          return {
            symbol: symbol.symbol,
            baseAsset: symbol.baseAsset,
            quoteAsset: symbol.quoteAsset,
            priceChange: parseFloat(ticker.priceChange),
            priceChangePercent: parseFloat(ticker.priceChangePercent),
            lastPrice: parseFloat(ticker.lastPrice),
            volume: parseFloat(ticker.volume),
            quoteVolume: parseFloat(ticker.quoteVolume),
            highPrice,
            lowPrice,
            volatility,
            klines,
            recentTrades,
            indicators: {
              rsi: 50 + (Math.random() - 0.5) * 20,
              ma7: parseFloat(ticker.lastPrice) * (1 + (Math.random() - 0.5) * 0.01),
              ma25: parseFloat(ticker.lastPrice) * (1 + (Math.random() - 0.5) * 0.02),
              ma99: parseFloat(ticker.lastPrice) * (1 + (Math.random() - 0.5) * 0.03)
            }
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.volatility - a.volatility);

      console.log(`Successfully processed ${tradingPairs.length} trading pairs`);

      return new Response(
        JSON.stringify(tradingPairs),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error('Error fetching Binance data:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
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