import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CoinData, Coin, Strategy } from "../types";

async function fetchSentimentData(symbol: string) {
  try {
    console.log('Fetching sentiment data for:', symbol);
    const response = await fetch(`https://crypto.techrealm.pk/coin/${symbol}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sentiment data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sentiment data:', error);
    return null;
  }
}

function analyzeSentiment(sentimentData: any): { 
  strategy: Strategy, 
  sentiment: { neutral: number; positive: number; negative: number; }
} {
  if (!sentimentData || !sentimentData.videos) {
    return {
      strategy: "hold",
      sentiment: { neutral: 33, positive: 33, negative: 34 }
    };
  }

  let buyCount = 0;
  let sellCount = 0;
  let othersCount = 0;
  let totalCount = 0;

  Object.values(sentimentData.videos).forEach((video: any) => {
    if (video.title_label === 'buy') buyCount++;
    else if (video.title_label === 'sell') sellCount++;
    else othersCount++;
    totalCount++;

    if (video.comments && Array.isArray(video.comments)) {
      video.comments.forEach((comment: any) => {
        if (comment.indicator === 'buy') buyCount++;
        else if (comment.indicator === 'sell') sellCount++;
        else othersCount++;
        totalCount++;
      });
    }
  });

  const total = totalCount || 1;
  const neutral = Math.round((othersCount / total) * 100);
  const positive = Math.round((buyCount / total) * 100);
  const negative = Math.round((sellCount / total) * 100);

  let strategy: Strategy;
  if (neutral > 50) {
    strategy = "COIN IS DEAD";
  } else if (positive > 20) {
    strategy = "buy";
  } else if (negative > 10) {
    strategy = "do not buy";
  } else {
    strategy = "hold";
  }

  return {
    strategy,
    sentiment: { neutral, positive, negative }
  };
}

interface BinancePairsOptions {
  includeKlines: boolean;
  interval: string;
  limit: string;
}

export function useCoinData() {
  return useQuery({
    queryKey: ['trading-coins'],
    queryFn: async (): Promise<Coin[]> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No authenticated session found');

        console.log('Fetching coin data from Edge Function...');
        const options: BinancePairsOptions = {
          includeKlines: true,
          interval: '1h',
          limit: '100'
        };

        const response = await supabase.functions.invoke('fetch-binance-pairs', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: options
        });

        if (response.error) {
          console.error('Error fetching coin data:', response.error);
          throw response.error;
        }

        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid response data:', response.data);
          throw new Error('Invalid response data from API');
        }

        const coinsWithSentiment = await Promise.all(
          response.data.map(async (coinData: CoinData) => {
            const sentimentData = await fetchSentimentData(coinData.baseAsset);
            const { strategy, sentiment } = analyzeSentiment(sentimentData);

            const klines = Array.isArray(coinData.klines) ? coinData.klines : [];
            const prices = klines
              .filter((k: any) => k && k.close)
              .map((k: any) => parseFloat(k.close));

            return {
              ...coinData,
              price: parseFloat(coinData.lastPrice),
              priceChange: coinData.priceChangePercent,
              strategy,
              analysis: `${strategy.toUpperCase()} - RSI: ${Math.round(coinData.indicators.rsi)}`,
              sentiment,
            };
          })
        );

        return coinsWithSentiment;
      } catch (error) {
        console.error('Error in useCoinData:', error);
        throw error;
      }
    },
    refetchInterval: 30000,
  });
}