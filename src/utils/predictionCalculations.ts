import type { Database } from "@/integrations/supabase/types";

type PredictionView = Database['public']['Tables']['prediction_views']['Row'];
type PredictionTrade = Database['public']['Tables']['prediction_trades']['Row'];

export const calculateTotalInitialAmount = (views: PredictionView[]) => {
  return views.reduce((sum, view) => sum + Number(view.initial_amount), 0);
};

export const calculateTotalCurrentAmount = (views: PredictionView[]) => {
  return views.reduce((sum, view) => sum + Number(view.current_amount), 0);
};

export const calculateProfitLossPercentage = (initial: number, current: number) => {
  return initial > 0 ? ((current - initial) / initial) * 100 : 0;
};

export const calculateTotalProfits = (trades: PredictionTrade[]) => {
  return trades
    .filter(trade => Number(trade.profit_loss) > 0)
    .reduce((sum, trade) => sum + Number(trade.profit_loss), 0);
};

export const calculateTotalLosses = (trades: PredictionTrade[]) => {
  return trades
    .filter(trade => Number(trade.profit_loss) < 0)
    .reduce((sum, trade) => sum + Number(trade.profit_loss), 0);
};

export const calculateProfitPercentage = (trades: PredictionTrade[], initialAmount: number) => {
  const totalProfits = calculateTotalProfits(trades);
  return initialAmount > 0 ? (totalProfits / initialAmount) * 100 : 0;
};

export const calculateLossPercentage = (trades: PredictionTrade[], initialAmount: number) => {
  const totalLosses = calculateTotalLosses(trades);
  return initialAmount > 0 ? (totalLosses / initialAmount) * 100 : 0;
};