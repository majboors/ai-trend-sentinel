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
    rsi: number;
    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };
    ma: {
      ma7: number;
      ma25: number;
      ma99: number;
    };
  };
  strategy: "buy" | "sell" | "hold" | "COIN IS DEAD" | "do not buy";
  klines: Array<{
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  marketCap: number;
  recentTrades: Array<{
    time: number;
    price: string;
    quantity: string;
    isBuyerMaker: boolean;
  }>;
}

export interface TradeViewState {
  id: string | null;
  currentIndex: number;
  coins: CoinData[];
}