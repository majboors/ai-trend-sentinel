import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CoinData } from "../types";

export function useCoinData() {
  return useQuery({
    queryKey: ['trading-coins'],
    queryFn: async (): Promise<CoinData[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated session found');

      // Fetch coins with klines data
      const response = await supabase.functions.invoke('fetch-binance-pairs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);

      // Transform the data to include indicators and strategy
      return response.data.map((coin: any) => ({
        ...coin,
        indicators: {
          positive: Math.random() * 100,
          neutral: Math.random() * 100,
          negative: Math.random() * 100,
        },
        strategy: determineStrategy(coin.priceChangePercent),
        klines: [], // Will be populated when viewing individual coins
      }));
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

function determineStrategy(priceChangePercent: number): "buy" | "sell" | "hold" {
  if (priceChangePercent > 2) return "buy";
  if (priceChangePercent < -2) return "sell";
  return "hold";
}