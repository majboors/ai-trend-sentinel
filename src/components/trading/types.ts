export type Strategy = "buy" | "sell" | "hold" | "COIN IS DEAD" | "do not buy";

export interface CoinData {
  baseAsset: string;
  quoteAsset: string;
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  strategy: Strategy;
  indicators?: {
    rsi: number;
    ma7: number;
    ma25: number;
    ma99: number;
  };
}