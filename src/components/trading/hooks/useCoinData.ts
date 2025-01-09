import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CoinData, Coin, Strategy } from "../types";

function calculateMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  const actualPeriod = Math.min(period, prices.length);
  const relevantPrices = prices.slice(-actualPeriod);
  return relevantPrices.reduce((a, b) => a + b, 0) / actualPeriod;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

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

  // Analyze comments from all videos
  Object.values(sentimentData.videos).forEach((video: any) => {
    // Count title sentiment
    if (video.title_label === 'buy') buyCount++;
    else if (video.title_label === 'sell') sellCount++;
    else othersCount++;
    totalCount++;

    // Count comment sentiments
    if (video.comments && Array.isArray(video.comments)) {
      video.comments.forEach((comment: any) => {
        if (comment.indicator === 'buy') buyCount++;
        else if (comment.indicator === 'sell') sellCount++;
        else othersCount++;
        totalCount++;
      });
    }
  });

  // Calculate percentages
  const total = totalCount || 1; // Prevent division by zero
  const neutral = Math.round((othersCount / total) * 100);
  const positive = Math.round((buyCount / total) * 100);
  const negative = Math.round((sellCount / total) * 100);

  // Determine strategy based on sentiment
  let strategy: Strategy;
  if (neutral > 50) {
    strategy = "COIN IS DEAD";
  } else if (positive > 20) {
    strategy = "buy";
  } else if (negative > 10) {
    strategy = "sell";
  } else {
    strategy = "hold";
  }

  return {
    strategy,
    sentiment: { neutral, positive, negative }
  };
}

export function useCoinData() {
  return useQuery({
    queryKey: ['trading-coins'],
    queryFn: async (): Promise<Coin[]> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No authenticated session found');

        console.log('Fetching coin data from Edge Function...');
        const response = await supabase.functions.invoke('fetch-binance-pairs', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            includeKlines: true,
            interval: '1h',
            limit: '100'  // Changed from number to string to fix type error
          }
        });

        if (response.error) {
          console.error('Error fetching coin data:', response.error);
          throw new Error(response.error.message);
        }

        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid response data:', response.data);
          throw new Error('Invalid response data from API');
        }

        // Fetch sentiment data for each coin
        const coinsWithSentiment = await Promise.all(
          response.data.map(async (coinData: CoinData) => {
            const sentimentData = await fetchSentimentData(coinData.baseAsset);
            const { strategy, sentiment } = analyzeSentiment(sentimentData);

            const klines = Array.isArray(coinData.klines) ? coinData.klines : [];
            const prices = klines
              .filter((k: any) => k && k.close)
              .map((k: any) => parseFloat(k.close));

            const rsi = calculateRSI(prices);
            const ma7 = calculateMA(prices, 7);
            const ma25 = calculateMA(prices, 25);
            const ma99 = calculateMA(prices, 99);

            return {
              ...coinData,
              price: parseFloat(coinData.lastPrice),
              priceChange: coinData.priceChangePercent,
              strategy,
              analysis: `${strategy.toUpperCase()} - RSI: ${Math.round(rsi)}`,
              sentiment,
              indicators: {
                rsi,
                ma7,
                ma25,
                ma99,
              },
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