export interface MarginAsset {
  symbol: string;
  free: string;
  locked: string;
}

export interface BinanceTrade {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

export interface WhaleTrade {
  user_id: string;
  symbol: string;
  amount: number;
  price: number;
  trade_type: 'buy' | 'sell';
  timestamp: Date;
}