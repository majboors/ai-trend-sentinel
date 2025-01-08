import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CoinData, Coin } from "../types";

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

function generateAnalysis(coin: CoinData): string {
  const { rsi, ma7, ma25, ma99 } = coin.indicators;
  let analysis = '';

  if (rsi > 70) {
    analysis += 'Overbought conditions. ';
  } else if (rsi < 30) {
    analysis += 'Oversold conditions. ';
  }

  if (ma7 > ma25) {
    analysis += 'Short-term uptrend. ';
  } else {
    analysis += 'Short-term downtrend. ';
  }

  if (ma25 > ma99) {
    analysis += 'Long-term bullish.';
  } else {
    analysis += 'Long-term bearish.';
  }

  return analysis;
}

function determineSentiment(rsi: number): string {
  if (rsi > 70) return "overbought";
  if (rsi < 30) return "oversold";
  if (rsi > 50) return "bullish";
  return "bearish";
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
            limit: '100'  // Ensure limit is passed as a string
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

        console.log('Successfully fetched coin data:', response.data);

        return response.data.map((coinData: CoinData): Coin => {
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
            analysis: generateAnalysis(coinData),
            sentiment: {
              neutral: Math.abs(50 - rsi),
              positive: rsi > 70 ? 100 : rsi > 50 ? 75 : 25,
              negative: rsi < 30 ? 100 : rsi < 50 ? 75 : 25
            },
            indicators: {
              rsi,
              ma7,
              ma25,
              ma99,
            },
          };
        });
      } catch (error) {
        console.error('Error in useCoinData:', error);
        throw error;
      }
    },
    refetchInterval: 30000,
  });
}