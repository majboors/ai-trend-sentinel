import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SentimentData } from "../types";
import { Loader2 } from "lucide-react";

interface TopCoinsCardProps {
  data: { [key: string]: SentimentData } | null;
  title: string;
  type: "buy" | "sell" | "others";
  className?: string;
}

export function TopCoinsCard({ data, title, type, className }: TopCoinsCardProps) {
  const processData = () => {
    if (!data) return [];
    
    const coinSentiments: Record<string, { count: number; total: number }> = {};
    
    try {
      // First pass: count sentiments for each coin
      Object.entries(data).forEach(([coin, coinData]) => {
        if (coinData?.videos) {
          let sentimentCount = 0;
          let totalComments = 0;
          
          Object.values(coinData.videos).forEach(video => {
            if (video?.comments) {
              video.comments.forEach(comment => {
                totalComments++;
                if (comment.indicator === type) {
                  sentimentCount++;
                }
              });
            }
          });
          
          if (totalComments > 0) {
            coinSentiments[coin] = {
              count: sentimentCount,
              total: totalComments
            };
          }
        }
      });

      // Convert to percentage and sort
      return Object.entries(coinSentiments)
        .map(([coin, { count, total }]) => ({
          coin: coin.length > 20 ? coin.substring(0, 20) + "..." : coin,
          percentage: (count / total) * 100,
          count
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10);
    } catch (error) {
      console.error('Error processing coin sentiments:', error);
      return [];
    }
  };

  const getBarColor = () => {
    switch (type) {
      case "buy":
        return "hsl(142.1 76.2% 36.3%)"; // Green
      case "sell":
        return "hsl(346.8 77.2% 49.8%)"; // Red
      default:
        return "hsl(47.9 95.8% 53.1%)"; // Yellow
    }
  };

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const chartData = processData();
  console.log(`Top ${type} Coins Data:`, chartData);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="coin" type="category" width={150} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Percentage']}
                />
                <Bar 
                  dataKey="percentage"
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