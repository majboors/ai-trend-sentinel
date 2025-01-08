import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchMarginAccount, fetchCrossMarginAccount, fetchSpotAccount, fetchTradesForSymbol } from "./services/binanceService.ts";
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

    console.log("Fetching all account types...");
    
    // Fetch all account types
    const [marginAssets, crossMarginAssets, spotAssets] = await Promise.all([
      fetchMarginAccount(apiKeys.binance_api_key, apiKeys.binance_api_secret),
      fetchCrossMarginAccount(apiKeys.binance_api_key, apiKeys.binance_api_secret),
      fetchSpotAccount(apiKeys.binance_api_key, apiKeys.binance_api_secret)
    ]);

    const allWhaleTrades: WhaleTrade[] = [];

    // Process margin trades
    for (const asset of marginAssets) {
      try {
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
    for (const asset of crossMarginAssets) {
      if (parseFloat(asset.free) > 0 || parseFloat(asset.locked) > 0) {
        try {
          const trades = await fetchTradesForSymbol(
            asset.asset + 'USDT', // Assuming USDT pairs, adjust if needed
            apiKeys.binance_api_key,
            apiKeys.binance_api_secret,
            'cross'
          );
          const whaleTrades = processTradesForWhales(trades, asset.asset + 'USDT', user.id);
          allWhaleTrades.push(...whaleTrades);
        } catch (error) {
          console.error(`Error processing cross margin trades for ${asset.asset}:`, error);
        }
      }
    }

    // Process spot trades
    for (const asset of spotAssets) {
      if (parseFloat(asset.free) > 0 || parseFloat(asset.locked) > 0) {
        try {
          const trades = await fetchTradesForSymbol(
            asset.asset + 'USDT', // Assuming USDT pairs, adjust if needed
            apiKeys.binance_api_key,
            apiKeys.binance_api_secret,
            'spot'
          );
          const whaleTrades = processTradesForWhales(trades, asset.asset + 'USDT', user.id);
          allWhaleTrades.push(...whaleTrades);
        } catch (error) {
          console.error(`Error processing spot trades for ${asset.asset}:`, error);
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