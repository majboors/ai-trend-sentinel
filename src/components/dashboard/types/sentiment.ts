export type Strategy = "buy" | "sell" | "hold" | "COIN IS DEAD" | "do not buy";

export interface SentimentData {
  type: string;
  value: number;
  color: string;
  strategy?: Strategy;
}

export interface MarketSentimentProps {
  onSentimentChange?: (sentimentData: SentimentData[]) => void;
  selectedCoin?: string;
}