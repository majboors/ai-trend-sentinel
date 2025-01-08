import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface SentimentStatsProps {
  loading: boolean;
  stats: {
    buy: number;
    sell: number;
    others: number;
    total: number;
  };
}

export function SentimentStats({ loading, stats }: SentimentStatsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { buy, sell, others, total } = stats;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Market Sentiment Analysis</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Positive (Buy)</span>
            <span>{total > 0 ? ((buy / total) * 100).toFixed(1) : 0}%</span>
          </div>
          <Progress value={total > 0 ? (buy / total) * 100 : 0} className="bg-green-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Negative (Sell)</span>
            <span>{total > 0 ? ((sell / total) * 100).toFixed(1) : 0}%</span>
          </div>
          <Progress value={total > 0 ? (sell / total) * 100 : 0} className="bg-red-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Neutral</span>
            <span>{total > 0 ? ((others / total) * 100).toFixed(1) : 0}%</span>
          </div>
          <Progress value={total > 0 ? (others / total) * 100 : 0} className="bg-yellow-500" />
        </div>
      </div>
    </Card>
  );
}