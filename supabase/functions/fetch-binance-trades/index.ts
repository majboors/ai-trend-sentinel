import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user
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

    // Fetch isolated margin account details
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = await createHmac(apiKeys.binance_api_secret, queryString);

    console.log("Fetching margin account details");

    const marginResponse = await fetch(
      `https://api.binance.com/sapi/v1/margin/isolated/account?${queryString}&signature=${signature}`,
      {
        headers: {
          "X-MBX-APIKEY": apiKeys.binance_api_key,
        },
      }
    );

    if (!marginResponse.ok) {
      console.error("Binance API error:", marginResponse.statusText);
      throw new Error(`Binance API error: ${marginResponse.statusText}`);
    }

    const marginData = await marginResponse.json();
    const allTrades = [];

    // Fetch trades for each isolated margin pair
    for (const asset of marginData.assets) {
      const symbol = asset.symbol;
      console.log(`Fetching trades for ${symbol}`);

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
        console.error(`Failed to fetch trades for ${symbol}:`, tradesResponse.statusText);
        continue;
      }

      const trades = await tradesResponse.json();
      
      // Process each trade
      const processedTrades = trades.map((trade: any) => ({
        id: trade.id,
        symbol: trade.symbol,
        price: trade.price,
        qty: trade.qty,
        commission: trade.commission,
        commissionAsset: trade.commissionAsset,
        time: trade.time,
        isBuyer: trade.isBuyer,
        profit: calculateProfit(trade),
      }));

      allTrades.push(...processedTrades);
    }

    console.log(`Successfully fetched ${allTrades.length} trades`);

    return new Response(JSON.stringify(allTrades), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in fetch-binance-trades:", error);
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

function calculateProfit(trade: any) {
  const price = parseFloat(trade.price);
  const qty = parseFloat(trade.qty);
  const commission = parseFloat(trade.commission);
  
  // Calculate total value of trade
  const tradeValue = price * qty;
  
  // Calculate profit/loss including commission
  // For buys, it's negative (money spent)
  // For sells, it's positive (money received)
  return trade.isBuyer ? -(tradeValue + commission) : (tradeValue - commission);
}

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