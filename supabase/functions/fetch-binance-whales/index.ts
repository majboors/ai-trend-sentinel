import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify environment variables are set
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
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
      console.error("Authentication error:", userError);
      throw new Error("User not authenticated");
    }

    console.log("Fetching API keys for user:", user.id);

    // Get user's API keys
    const { data: apiKeys, error: apiKeysError } = await supabaseClient
      .from("api_keys")
      .select("binance_api_key, binance_api_secret")
      .eq("user_id", user.id)
      .single();

    if (apiKeysError || !apiKeys) {
      console.error("API keys error:", apiKeysError);
      throw new Error("No API keys found");
    }

    console.log("Successfully retrieved API keys");

    // First fetch isolated margin account details - similar to margin_account = client.get_isolated_margin_account()
    const accountTimestamp = Date.now();
    const accountQueryString = `timestamp=${accountTimestamp}`;
    const accountSignature = await createHmac(apiKeys.binance_api_secret, accountQueryString);

    console.log("Fetching isolated margin account details...");

    const marginResponse = await fetch(
      `https://api.binance.com/sapi/v1/margin/isolated/account?${accountQueryString}&signature=${accountSignature}`,
      {
        headers: {
          "X-MBX-APIKEY": apiKeys.binance_api_key,
        },
      }
    );

    if (!marginResponse.ok) {
      const errorText = await marginResponse.text();
      console.error("Binance API error:", errorText);
      throw new Error(`Binance API error: ${marginResponse.statusText} - ${errorText}`);
    }

    const marginData = await marginResponse.json();
    console.log("Successfully fetched margin account details:", marginData);

    const allTrades = [];

    // Iterate over each trading pair - similar to for asset in margin_account['assets']
    for (const asset of marginData.assets) {
      const symbol = asset.symbol;
      console.log(`Fetching trades for ${symbol}...`);

      // Similar to trades = client.get_margin_trades(symbol=symbol, isIsolated='TRUE')
      const tradeTimestamp = Date.now();
      const tradeQueryString = `symbol=${symbol}&isIsolated=TRUE&timestamp=${tradeTimestamp}`;
      const tradeSignature = await createHmac(apiKeys.binance_api_secret, tradeQueryString);

      try {
        const tradesResponse = await fetch(
          `https://api.binance.com/sapi/v1/margin/myTrades?${tradeQueryString}&signature=${tradeSignature}`,
          {
            headers: {
              "X-MBX-APIKEY": apiKeys.binance_api_key,
            },
          }
        );

        if (!tradesResponse.ok) {
          console.error(`Failed to fetch trades for ${symbol}: ${tradesResponse.statusText}`);
          continue;
        }

        const trades = await tradesResponse.json();
        console.log(`Found ${trades.length} trades for ${symbol}`);

        // Process each trade - similar to the Python print statement
        const processedTrades = trades.map((trade: any) => {
          const tradeValue = parseFloat(trade.price) * parseFloat(trade.qty);
          return {
            user_id: user.id,
            symbol: trade.symbol,
            amount: tradeValue,
            price: parseFloat(trade.price),
            trade_type: trade.isBuyer ? 'buy' : 'sell',
            timestamp: new Date(trade.time),
          };
        });

        // Only store trades over $100k
        const whaleTrades = processedTrades.filter(trade => trade.amount > 100000);
        allTrades.push(...whaleTrades);
      } catch (error) {
        console.error(`Error processing trades for ${symbol}:`, error);
      }
    }

    // Store whale trades in the database
    if (allTrades.length > 0) {
      console.log(`Storing ${allTrades.length} whale trades in database`);
      const { error: insertError } = await supabaseClient
        .from('whale_trades')
        .insert(allTrades);

      if (insertError) {
        console.error('Error inserting whale trades:', insertError);
        throw insertError;
      }
    } else {
      console.log('No whale trades found');
    }

    return new Response(JSON.stringify(allTrades), {
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

async function createHmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}