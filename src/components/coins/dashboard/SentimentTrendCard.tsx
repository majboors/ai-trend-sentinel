import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { SentimentData } from "../types";
import { Loader2 } from "lucide-react";

interface SentimentTrendCardProps {
  data: { [key: string]: SentimentData } | null;
  title: string;
  className?: string;
}

export function SentimentTrendCard({ data, title, className }: SentimentTrendCardProps) {
  const processData = () => {
    if (!data) return [];
    
    const timelineData: Record<string, { buy: number; sell: number; others: number; total: number }> = {};
    
    try {
      Object.entries(data).forEach(([_, coinData]) => {
        if (coinData?.videos) {
          Object.values(coinData.videos).forEach(video => {
            if (video?.comments) {
              video.comments.forEach(comment => {
                const date = new Date().toLocaleDateString();
                if (!timelineData[date]) {
                  timelineData[date] = { buy: 0, sell: 0, others: 0, total: 0 };
                }
                timelineData[date].total++;
                if (comment.indicator === 'buy') timelineData[date].buy++;
                else if (comment.indicator === 'sell') timelineData[date].sell++;
                else timelineData[date].others++;
              });
            }
          });
        }
      });

      return Object.entries(timelineData).map(([date, counts]) => ({
        date,
        buy: counts.total > 0 ? (counts.buy / counts.total) * 100 : 0,
        sell: counts.total > 0 ? (counts.sell / counts.total) * 100 : 0,
        others: counts.total > 0 ? (counts.others / counts.total) * 100 : 0
      }));
    } catch (error) {
      console.error('Error processing timeline data:', error);
      return [];
    }
  };

  const chartData = processData();
  console.log('Sentiment Trends Data:', chartData);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          {!data ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Percentage']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="buy" 
                  stroke="hsl(142.1 76.2% 36.3%)" 
                  name="Bullish"
                />
                <Line 
                  type="monotone" 
                  dataKey="sell" 
                  stroke="hsl(346.8 77.2% 49.8%)" 
                  name="Bearish"
                />
                <Line 
                  type="monotone" 
                  dataKey="others" 
                  stroke="hsl(47.9 95.8% 53.1%)" 
                  name="Neutral"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}