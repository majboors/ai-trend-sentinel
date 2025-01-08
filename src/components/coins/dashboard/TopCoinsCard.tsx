import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SentimentData } from "../types";

interface TopCoinsCardProps {
  data: SentimentData | null;
  title: string;
  type: "buy" | "sell" | "others";
}

export function TopCoinsCard({ data, title, type }: TopCoinsCardProps) {
  const processData = () => {
    if (!data) return [];
    
    const coinSentiments: Record<string, number> = {};
    Object.entries(data.videos).forEach(([_, video]) => {
      video.comments.forEach(comment => {
        if (comment.indicator === type) {
          coinSentiments[video.title] = (coinSentiments[video.title] || 0) + 1;
        }
      });
    });

    return Object.entries(coinSentiments)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([coin, count]) => ({
        coin: coin.length > 20 ? coin.substring(0, 20) + "..." : coin,
        count,
      }));
  };

  const getBarColor = () => {
    switch (type) {
      case "buy":
        return "hsl(142.1 76.2% 36.3%)"; // green-600
      case "sell":
        return "hsl(346.8 77.2% 49.8%)"; // red-500
      default:
        return "hsl(47.9 95.8% 53.1%)"; // yellow-400
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="coin" type="category" width={150} />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill={getBarColor()}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}