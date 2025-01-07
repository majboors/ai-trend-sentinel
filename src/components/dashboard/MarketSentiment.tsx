import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SentimentData {
  type: string;
  value: number;
  color: string;
}

const sentimentData: SentimentData[] = [
  { type: "Positive", value: 70, color: "bg-green-500" },
  { type: "Neutral", value: 20, color: "bg-yellow-500" },
  { type: "Negative", value: 10, color: "bg-red-500" },
];

export function MarketSentiment() {
  return (
    <Card className="glass-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Market Sentiment</h3>
      <div className="space-y-4">
        {sentimentData.map((sentiment) => (
          <div key={sentiment.type} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{sentiment.type}</span>
              <span>{sentiment.value}%</span>
            </div>
            <Progress value={sentiment.value} className={sentiment.color} />
          </div>
        ))}
      </div>
    </Card>
  );
}