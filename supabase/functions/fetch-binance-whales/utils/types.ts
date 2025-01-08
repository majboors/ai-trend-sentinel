export interface MarginAsset {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface WhaleTrade {
  user_id: string;
  symbol: string;
  amount: number;
  price: number;
  trade_type: 'buy' | 'sell';
  timestamp: Date;
}

export interface BinanceTrade {
  id: string;
  symbol: string;
  price: string;
  qty: string;
  time: number;
  isBuyer: boolean;
}