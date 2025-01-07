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
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
}

async function fetchSpotCoins(): Promise<SymbolInfo[]> {
  console.log('Fetching spot coins...');
  const [exchangeInfo, tickers] = await Promise.all([
    fetch('https://api.binance.com/api/v3/exchangeInfo').then(res => res.json()),
    fetch('https://api.binance.com/api/v3/ticker/24hr').then(res => res.json())
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
        priceChangePercent: ticker.priceChangePercent || '0',
        lastPrice: ticker.lastPrice || '0',
        volume: ticker.volume || '0',
        quoteVolume: ticker.quoteVolume || '0'
      };
    });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Fetching all coins for user:', user.id);
    const spotCoins = await fetchSpotCoins();
    
    // Process and format the data
    const processedData = spotCoins.map((item) => ({
      symbol: item.symbol,
      baseAsset: item.baseAsset,
      quoteAsset: item.quoteAsset,
      priceChange: 0,
      priceChangePercent: parseFloat(item.priceChangePercent),
      lastPrice: parseFloat(item.lastPrice),
      volume: parseFloat(item.volume),
      quoteVolume: parseFloat(item.quoteVolume),
      profit: parseFloat(item.priceChangePercent) > 0,
    }));

    return new Response(
      JSON.stringify(processedData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in fetch-binance-pairs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})