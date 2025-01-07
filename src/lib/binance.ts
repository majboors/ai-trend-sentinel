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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw new Error(`Session error: ${sessionError.message}`);
    if (!session) throw new Error('No authenticated session found');
    if (!session.access_token) throw new Error('No access token found in session');

    console.log('Fetching spot balances...');
    const { data: spotBalances, error: spotError } = await supabase.functions.invoke(
      'fetch-binance-spot',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (spotError) {
      console.error('Spot balance error:', spotError);
      throw spotError;
    }

    console.log('Fetching margin balances...');
    const { data: marginBalances, error: marginError } = await supabase.functions.invoke(
      'fetch-binance-margin',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (marginError) {
      console.error('Margin balance error:', marginError);
      throw marginError;
    }
    
    return {
      spot: spotBalances,
      margin: marginBalances,
    };
  } catch (error) {
    console.error('Error fetching balances:', error);
    throw error;
  }
}