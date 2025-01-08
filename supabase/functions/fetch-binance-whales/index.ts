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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
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

    // Get user's API keys
    const { data: apiKeys, error: apiKeysError } = await supabaseClient
      .from("api_keys")
      .select("binance_api_key, binance_api_secret")
      .eq("user_id", user.id)
      .single();

    if (apiKeysError || !apiKeys) {
      throw new Error("No API keys found");
    }

    // Fetch isolated margin account details
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = await createHmac(apiKeys.binance_api_secret, queryString);

    console.log("Fetching isolated margin account details...");

    const marginResponse = await fetch(
      `https://api.binance.com/sapi/v1/margin/isolated/account?${queryString}&signature=${signature}`,
      {
        headers: {
          "X-MBX-APIKEY": apiKeys.binance_api_key,
        },
      }
    );

    if (!marginResponse.ok) {
      throw new Error(`Binance API error: ${marginResponse.statusText}`);
    }

    const marginData = await marginResponse.json();
    const whales = [];

    // Fetch trades for each isolated margin pair
    for (const asset of marginData.assets) {
      const symbol = asset.symbol;
      console.log(`Fetching trades for ${symbol}...`);

      const tradeTimestamp = Date.now();
      const tradeQueryString = `symbol=${symbol}&isIsolated=TRUE&timestamp=${tradeTimestamp}`;
      const tradeSignature = await createHmac(apiKeys.binance_api_secret, tradeQueryString);

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
      
      // Process and filter whale trades (e.g., large volume trades)
      const whaleTrades = trades
        .filter((trade: any) => parseFloat(trade.qty) * parseFloat(trade.price) > 100000) // Filter trades > $100k
        .map((trade: any) => ({
          user_id: user.id,
          symbol: trade.symbol,
          amount: parseFloat(trade.qty) * parseFloat(trade.price),
          price: parseFloat(trade.price),
          trade_type: trade.isBuyer ? 'buy' : 'sell',
          timestamp: new Date(trade.time),
        }));

      whales.push(...whaleTrades);
    }

    // Store whale trades in the database
    if (whales.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('whale_trades')
        .insert(whales);

      if (insertError) {
        console.error('Error inserting whale trades:', insertError);
        throw insertError;
      }
    }

    return new Response(JSON.stringify(whales), {
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