export type Strategy = "buy" | "sell" | "hold" | "COIN IS DEAD" | "do not buy";

export interface CoinData {
  baseAsset: string;
  quoteAsset: string;
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  strategy: Strategy;
  volume?: number;
  quoteVolume?: number;
  indicators: {
    rsi: number;
    ma7: number;
    ma25: number;
    ma99: number;
  };
  klines: Array<{
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  recentTrades: Array<{
    time: number;
    price: string;
    quantity: string;
    isBuyerMaker: boolean;
  }>;
}

export interface Coin extends CoinData {
  price: number;
  priceChange: number;
  analysis: string;
  sentiment: {
    neutral: number;
    positive: number;
    negative: number;
  };
}

export interface TradeViewState {
  id: string | null;
  currentIndex: number;
  coins: CoinData[];
}