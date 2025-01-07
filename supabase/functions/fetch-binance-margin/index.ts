import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from fetch-binance-margin!");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user's API keys
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

    // Fetch isolated margin account information from Binance
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = await createHmac(apiKeys.binance_api_secret, queryString);

    const response = await fetch(
      `https://api.binance.com/sapi/v1/margin/isolated/account?${queryString}&signature=${signature}`,
      {
        headers: {
          "X-MBX-APIKEY": apiKeys.binance_api_key,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const assets: any[] = [];

    // Process isolated margin assets
    data.assets.forEach((pair: any) => {
      const baseAsset = pair.baseAsset;
      const quoteAsset = pair.quoteAsset;

      if (parseFloat(baseAsset.free) > 0 || parseFloat(baseAsset.locked) > 0) {
        assets.push({
          asset: baseAsset.asset,
          free: baseAsset.free,
          locked: baseAsset.locked,
        });
      }

      if (parseFloat(quoteAsset.free) > 0 || parseFloat(quoteAsset.locked) > 0) {
        assets.push({
          asset: quoteAsset.asset,
          free: quoteAsset.free,
          locked: quoteAsset.locked,
        });
      }
    });

    return new Response(JSON.stringify(assets), {
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