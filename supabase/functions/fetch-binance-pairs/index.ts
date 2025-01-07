import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

async function fetchSpotPairs() {
  console.log('Fetching spot trading pairs...');
  const [exchangeInfo, tickers] = await Promise.all([
    fetch('https://api.binance.com/api/v3/exchangeInfo').then(res => res.json()),
    fetch('https://api.binance.com/api/v3/ticker/24hr').then(res => res.json())
  ]);

  const tickersMap = new Map(tickers.map((t: any) => [t.symbol, t]));
  
  return exchangeInfo.symbols
    .filter((s: any) => s.status === 'TRADING' && s.isSpotTradingAllowed)
    .map((s: any) => {
      const ticker = tickersMap.get(s.symbol) || {};
      return {
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        priceChangePercent: parseFloat(ticker.priceChangePercent || '0'),
        lastPrice: parseFloat(ticker.lastPrice || '0'),
        volume: parseFloat(ticker.volume || '0'),
        quoteVolume: parseFloat(ticker.quoteVolume || '0'),
        profit: parseFloat(ticker.priceChangePercent || '0') > 0
      };
    });
}

async function fetchUSDTFuturesPairs() {
  console.log('Fetching USDT-M futures pairs...');
  const [exchangeInfo, tickers] = await Promise.all([
    fetch('https://fapi.binance.com/fapi/v1/exchangeInfo').then(res => res.json()),
    fetch('https://fapi.binance.com/fapi/v1/ticker/24hr').then(res => res.json())
  ]);

  const tickersMap = new Map(tickers.map((t: any) => [t.symbol, t]));

  return exchangeInfo.symbols
    .filter((s: any) => s.status === 'TRADING')
    .map((s: any) => {
      const ticker = tickersMap.get(s.symbol) || {};
      return {
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        priceChangePercent: parseFloat(ticker.priceChangePercent || '0'),
        lastPrice: parseFloat(ticker.lastPrice || '0'),
        volume: parseFloat(ticker.volume || '0'),
        quoteVolume: parseFloat(ticker.quoteVolume || '0'),
        profit: parseFloat(ticker.priceChangePercent || '0') > 0
      };
    });
}

async function fetchCOINFuturesPairs() {
  console.log('Fetching COIN-M futures pairs...');
  const [exchangeInfo, tickers] = await Promise.all([
    fetch('https://dapi.binance.com/dapi/v1/exchangeInfo').then(res => res.json()),
    fetch('https://dapi.binance.com/dapi/v1/ticker/24hr').then(res => res.json())
  ]);

  const tickersMap = new Map(tickers.map((t: any) => [t.symbol, t]));

  return exchangeInfo.symbols
    .filter((s: any) => s.status === 'TRADING')
    .map((s: any) => {
      const ticker = tickersMap.get(s.symbol) || {};
      return {
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        priceChangePercent: parseFloat(ticker.priceChangePercent || '0'),
        lastPrice: parseFloat(ticker.lastPrice || '0'),
        volume: parseFloat(ticker.volume || '0'),
        quoteVolume: parseFloat(ticker.quoteVolume || '0'),
        profit: parseFloat(ticker.priceChangePercent || '0') > 0
      };
    });
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
    
    // Fetch all pairs concurrently
    const [spotPairs, usdtFuturesPairs, coinFuturesPairs] = await Promise.all([
      fetchSpotPairs(),
      fetchUSDTFuturesPairs(),
      fetchCOINFuturesPairs()
    ]);

    // Combine all pairs and remove duplicates based on symbol
    const allPairs = [...spotPairs, ...usdtFuturesPairs, ...coinFuturesPairs];
    const uniquePairs = Array.from(
      new Map(allPairs.map(item => [item.symbol, item])).values()
    );

    console.log(`Total unique trading pairs found: ${uniquePairs.length}`);
    console.log('Sample of pairs:', uniquePairs.slice(0, 5));

    return new Response(
      JSON.stringify(uniquePairs),
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