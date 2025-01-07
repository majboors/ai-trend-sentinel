import type { Database } from "@/integrations/supabase/types";

type PredictionTrade = Database['public']['Tables']['prediction_trades']['Row'];

export interface ChartData {
  date: string;
  value: number;
}

export const processTradesData = (
  trades: PredictionTrade[],
  filter?: (trade: PredictionTrade) => boolean
): ChartData[] => {
  console.log('Processing trades:', trades);
  
  if (!trades || trades.length === 0) {
    console.log('No trades to process');
    return [];
  }

  // Sort trades by date
  const sortedTrades = trades.sort((a, b) => 
    new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
  );
  console.log('Sorted trades:', sortedTrades);

  // Filter trades if filter function is provided
  const filteredTrades = filter ? sortedTrades.filter(filter) : sortedTrades;
  console.log('Filtered trades:', filteredTrades);

  // Group trades by date and calculate cumulative value
  const dailyData: { [key: string]: number } = {};
  let cumulative = 0;

  filteredTrades.forEach(trade => {
    if (!trade.created_at || trade.profit_loss === null) return;

    const date = new Date(trade.created_at).toLocaleDateString();
    const profitLoss = Number(trade.profit_loss);

    if (isNaN(profitLoss)) {
      console.log('Invalid profit/loss value:', trade);
      return;
    }

    cumulative += profitLoss;
    dailyData[date] = cumulative;
    console.log(`Date: ${date}, ProfitLoss: ${profitLoss}, Cumulative: ${cumulative}`);
  });

  // Convert to chart format
  return Object.entries(dailyData).map(([date, value]) => ({
    date,
    value: Number(value.toFixed(2))
  }));
};