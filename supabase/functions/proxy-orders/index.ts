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
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user from the request
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

    // Get order details from request body
    const orderDetails = await req.json();
    console.log("Received order details:", orderDetails);

    // Create timestamp and signature for Binance API
    const timestamp = Date.now();
    const queryString = `symbol=${orderDetails.symbol}&side=${orderDetails.side}&type=${orderDetails.type}&quantity=${orderDetails.quantity}&timestamp=${timestamp}`;
    
    if (orderDetails.price) {
      queryString += `&price=${orderDetails.price}`;
    }

    const signature = await createHmac(apiKeys.binance_api_secret, queryString);

    // Forward the order to Binance
    console.log("Sending order to Binance...");
    const response = await fetch(
      `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`,
      {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": apiKeys.binance_api_key,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Binance API error:", response.status, errorText);
      throw new Error(`Binance API error: ${errorText}`);
    }

    const orderResponse = await response.json();
    console.log("Order placed successfully:", orderResponse);

    // Store the order in our database
    const { error: insertError } = await supabaseClient
      .from("transactions")
      .insert({
        user_id: user.id,
        symbol: orderResponse.symbol,
        amount: parseFloat(orderResponse.executedQty),
        price: parseFloat(orderResponse.price),
        type: orderResponse.side.toLowerCase(),
        status: orderResponse.status.toLowerCase(),
        account_type: orderDetails.accountType || "spot",
      });

    if (insertError) {
      console.error("Error storing transaction:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify(orderResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in proxy-orders:", error);
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