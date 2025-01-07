import { supabase } from "@/integrations/supabase/client";

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface MarginBalance {
  asset: string;
  borrowed: string;
  free: string;
  interest: string;
  locked: string;
  netAsset: string;
}

export async function fetchBinanceBalances() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No authenticated session found');
    }

    const { data: spotBalances, error: spotError } = await supabase.functions.invoke(
      'fetch-binance-spot',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (spotError) throw spotError;

    const { data: marginBalances, error: marginError } = await supabase.functions.invoke(
      'fetch-binance-margin',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (marginError) throw marginError;
    
    return {
      spot: spotBalances,
      margin: marginBalances,
    };
  } catch (error) {
    console.error('Error fetching balances:', error);
    throw error;
  }
}