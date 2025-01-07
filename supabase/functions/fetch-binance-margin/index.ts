import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Hello from fetch-binance-margin!");

serve(async (req) => {
  // Handle CORS preflight requests
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
    if (!user) {
      throw new Error("No user found");
    }

    console.log('Fetching API keys for user:', user.id);
    const { data: apiKeys, error: apiKeysError } = await supabaseClient
      .from("api_keys")
      .select("binance_api_key, binance_api_secret")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apiKeysError || !apiKeys) {
      console.error('API keys error:', apiKeysError);
      throw new Error("No API keys found");
    }

    // Fetch isolated margin account information from Binance
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = await createHmac(apiKeys.binance_api_secret, queryString);

    console.log('Fetching margin account info from Binance...');
    const response = await fetch(
      `https://api.binance.com/sapi/v1/margin/isolated/account?${queryString}&signature=${signature}`,
      {
        headers: {
          "X-MBX-APIKEY": apiKeys.binance_api_key,
        },
      }
    );

    if (!response.ok) {
      console.error('Binance API error:', response.status, await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully fetched margin account data');
    
    return new Response(JSON.stringify(data.assets), {
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