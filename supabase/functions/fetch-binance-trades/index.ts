import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from fetch-binance-trades!");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("No user found");

    const { data: apiKeys, error: apiKeysError } = await supabaseClient
      .from("api_keys")
      .select("binance_api_key, binance_api_secret")
      .eq("user_id", user.id)
      .single();

    if (apiKeysError || !apiKeys) {
      throw new Error("No API keys found");
    }

    // Fetch isolated margin account first to get all pairs
    const accountResponse = await fetch(
      `https://api.binance.com/sapi/v1/margin/isolated/account?timestamp=${Date.now()}`,
      {
        headers: {
          "X-MBX-APIKEY": apiKeys.binance_api_key,
        },
      }
    );

    if (!accountResponse.ok) {
      throw new Error(`HTTP error! status: ${accountResponse.status}`);
    }

    const accountData = await accountResponse.json();
    const allTrades = [];

    // Fetch trades for each pair
    for (const asset of accountData.assets) {
      const symbol = asset.symbol;
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}&isIsolated=TRUE&timestamp=${timestamp}`;
      const signature = await createHmac(apiKeys.binance_api_secret, queryString);

      const response = await fetch(
        `https://api.binance.com/sapi/v1/margin/myTrades?${queryString}&signature=${signature}`,
        {
          headers: {
            "X-MBX-APIKEY": apiKeys.binance_api_key,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch trades for ${symbol}: ${response.status}`);
        continue;
      }

      const trades = await response.json();
      allTrades.push(...trades.map((trade: any) => ({
        ...trade,
        symbol,
        profit: calculateProfit(trade),
      })));
    }

    return new Response(JSON.stringify(allTrades), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function calculateProfit(trade: any) {
  const price = parseFloat(trade.price);
  const qty = parseFloat(trade.qty);
  const commission = parseFloat(trade.commission);
  
  // Calculate total value of trade
  const tradeValue = price * qty;
  
  // Calculate profit/loss including commission
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