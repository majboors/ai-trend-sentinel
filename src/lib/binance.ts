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
    const { data: spotBalances } = await supabase.functions.invoke('fetch-binance-spot');
    const { data: marginBalances } = await supabase.functions.invoke('fetch-binance-margin');
    
    return {
      spot: spotBalances,
      margin: marginBalances,
    };
  } catch (error) {
    console.error('Error fetching balances:', error);
    throw error;
  }
}