import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CoinData } from "../types";

function calculateMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  
  // If we don't have enough data for the full period, use what we have
  const actualPeriod = Math.min(period, prices.length);
  const relevantPrices = prices.slice(-actualPeriod);
  const sum = relevantPrices.reduce((a, b) => a + b, 0);
  
  return sum / actualPeriod;
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

export function useCoinData() {
  return useQuery({
    queryKey: ['trading-coins'],
    queryFn: async (): Promise<CoinData[]> => {
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
            limit: 24
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

        return response.data.map((coin: any) => {
          // Process klines data
          const klines = Array.isArray(coin.klines) ? coin.klines : [];
          const prices = klines
            .filter((k: any) => k && k.close)
            .map((k: any) => parseFloat(k.close));

          console.log(`Processing ${coin.symbol} with ${prices.length} price points:`, prices);

          // Calculate indicators using actual price data
          const rsi = calculateRSI(prices);
          const ma7 = calculateMA(prices, 7);
          const ma25 = calculateMA(prices, 25);
          const ma99 = calculateMA(prices, 99);

          console.log(`${coin.symbol} indicators:`, { rsi, ma7, ma25, ma99 });

          // Process MACD (12, 26, 9)
          const ema12 = calculateMA(prices, 12);
          const ema26 = calculateMA(prices, 26);
          const macd = ema12 - ema26;
          const signal = calculateMA([macd], 9);
          const histogram = macd - signal;

          // Create processed klines with proper data types
          const processedKlines = klines.map((k: any) => ({
            openTime: k?.openTime || Date.now(),
            open: k?.open || coin.lastPrice?.toString() || "0",
            high: k?.high || coin.lastPrice?.toString() || "0",
            low: k?.low || coin.lastPrice?.toString() || "0",
            close: k?.close || coin.lastPrice?.toString() || "0",
            volume: k?.volume || coin.volume?.toString() || "0"
          }));

          // If no klines data, create historical data points
          if (processedKlines.length === 0) {
            const timestamps = Array.from({ length: 24 }, (_, i) => 
              Date.now() - (23 - i) * 60 * 60 * 1000
            );
            
            const basePrice = parseFloat(coin.lastPrice?.toString() || "0");
            processedKlines.push(...timestamps.map((time, index) => {
              // Create some variation in the historical prices
              const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
              const historicalPrice = (basePrice * (1 + variation)).toString();
              
              return {
                openTime: time,
                open: historicalPrice,
                high: (parseFloat(historicalPrice) * 1.005).toString(), // +0.5%
                low: (parseFloat(historicalPrice) * 0.995).toString(),  // -0.5%
                close: historicalPrice,
                volume: (coin.volume * (Math.random() * 0.5 + 0.75)).toString() // 75-125% of current volume
              };
            }));
          }

          return {
            ...coin,
            klines: processedKlines,
            indicators: {
              positive: rsi > 70 ? 100 : rsi > 50 ? 75 : 25,
              neutral: Math.abs(50 - rsi),
              negative: rsi < 30 ? 100 : rsi < 50 ? 75 : 25,
              rsi,
              macd: {
                macd,
                signal,
                histogram
              },
              ma: {
                ma7,
                ma25,
                ma99
              },
            },
            strategy: determineStrategy(coin.priceChangePercent),
            marketCap: coin.volume * parseFloat(coin.lastPrice || "0"),
            recentTrades: Array.from({ length: 20 }, (_, i) => ({
              time: Date.now() - i * 60000,
              price: (parseFloat(coin.lastPrice || "0") + (Math.random() - 0.5) * 10).toString(),
              quantity: (Math.random() * 100).toString(),
              isBuyerMaker: Math.random() > 0.5,
            })),
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

function determineStrategy(priceChangePercent: number): "buy" | "sell" | "hold" {
  if (priceChangePercent > 2) return "buy";
  if (priceChangePercent < -2) return "sell";
  return "hold";
}