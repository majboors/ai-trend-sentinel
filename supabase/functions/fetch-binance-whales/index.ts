import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchMarginAccount, fetchCrossMarginAccount, fetchSpotAccount, fetchTradesForSymbol, fetchAllTradingPairs } from "./services/binanceService.ts";
import { processTradesForWhales } from "./services/tradeProcessor.ts";
import type { WhaleTrade } from "./utils/types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing required environment variables");
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { data: apiKeys, error: apiKeysError } = await supabaseClient
      .from("api_keys")
      .select("binance_api_key, binance_api_secret")
      .eq("user_id", user.id)
      .single();

    if (apiKeysError || !apiKeys) {
      throw new Error("No API keys found");
    }

    console.log("Fetching all trading pairs...");
    const tradingPairs = await fetchAllTradingPairs(apiKeys.binance_api_key);
    console.log(`Processing ${tradingPairs.length} trading pairs`);

    const allWhaleTrades: WhaleTrade[] = [];

    // Process spot trades for all trading pairs
    const spotAssets = await fetchSpotAccount(apiKeys.binance_api_key, apiKeys.binance_api_secret);
    for (const asset of spotAssets) {
      if (parseFloat(asset.free) > 0 || parseFloat(asset.locked) > 0) {
        const pairs = tradingPairs.filter(pair => pair.startsWith(asset.asset));
        for (const pair of pairs) {
          try {
            console.log(`Fetching spot trades for ${pair}...`);
            const trades = await fetchTradesForSymbol(
              pair,
              apiKeys.binance_api_key,
              apiKeys.binance_api_secret,
              'spot'
            );
            const whaleTrades = processTradesForWhales(trades, pair, user.id);
            allWhaleTrades.push(...whaleTrades);
          } catch (error) {
            console.error(`Error processing spot trades for ${pair}:`, error);
          }
        }
      }
    }

    // Process margin trades
    const marginAssets = await fetchMarginAccount(apiKeys.binance_api_key, apiKeys.binance_api_secret);
    for (const asset of marginAssets) {
      try {
        console.log(`Fetching margin trades for ${asset.symbol}...`);
        const trades = await fetchTradesForSymbol(
          asset.symbol,
          apiKeys.binance_api_key,
          apiKeys.binance_api_secret,
          'margin'
        );
        const whaleTrades = processTradesForWhales(trades, asset.symbol, user.id);
        allWhaleTrades.push(...whaleTrades);
      } catch (error) {
        console.error(`Error processing margin trades for ${asset.symbol}:`, error);
      }
    }

    // Process cross margin trades
    const crossMarginAssets = await fetchCrossMarginAccount(apiKeys.binance_api_key, apiKeys.binance_api_secret);
    for (const asset of crossMarginAssets) {
      if (parseFloat(asset.free) > 0 || parseFloat(asset.locked) > 0) {
        const pairs = tradingPairs.filter(pair => pair.startsWith(asset.asset));
        for (const pair of pairs) {
          try {
            console.log(`Fetching cross margin trades for ${pair}...`);
            const trades = await fetchTradesForSymbol(
              pair,
              apiKeys.binance_api_key,
              apiKeys.binance_api_secret,
              'cross'
            );
            const whaleTrades = processTradesForWhales(trades, pair, user.id);
            allWhaleTrades.push(...whaleTrades);
          } catch (error) {
            console.error(`Error processing cross margin trades for ${pair}:`, error);
          }
        }
      }
    }

    // Store whale trades in database
    if (allWhaleTrades.length > 0) {
      console.log(`\nStoring ${allWhaleTrades.length} whale trades in database`);
      
      const { error: insertError } = await supabaseClient
        .from('whale_trades')
        .insert(allWhaleTrades);

      if (insertError) {
        throw insertError;
      }
      console.log('Successfully stored whale trades in database');
    } else {
      console.log('\nNo whale trades found in any pairs');
    }

    return new Response(JSON.stringify(allWhaleTrades), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in fetch-binance-whales:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.message.includes("not authenticated") ? 401 : 500,
      }
    );
  }
});