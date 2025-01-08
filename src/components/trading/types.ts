export interface CoinData {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  priceChange: number;
  priceChangePercent: number;
  lastPrice: number;
  volume: number;
  quoteVolume: number;
  indicators: {
    positive: number;
    neutral: number;
    negative: number;
  };
  strategy: "buy" | "sell" | "hold";
  klines: Array<{
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
}

export interface TradeViewState {
  id: string | null;
  currentIndex: number;
  coins: CoinData[];
}