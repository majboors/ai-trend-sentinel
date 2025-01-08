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
    
    const timelineData: Record<string, { buy: number; sell: number; others: number }> = {};
    
    try {
      Object.entries(data).forEach(([_, coinData]) => {
        if (coinData && coinData.videos) {
          Object.values(coinData.videos).forEach(video => {
            if (video && video.comments) {
              video.comments.forEach(comment => {
                const date = new Date().toLocaleDateString();
                if (!timelineData[date]) {
                  timelineData[date] = { buy: 0, sell: 0, others: 0 };
                }
                if (comment.indicator in timelineData[date]) {
                  timelineData[date][comment.indicator as keyof typeof timelineData[string]]++;
                }
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('Error processing timeline data:', error);
      return [];
    }

    return Object.entries(timelineData).map(([date, counts]) => ({
      date,
      ...counts,
    }));
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="buy" stroke="hsl(142.1 76.2% 36.3%)" />
                <Line type="monotone" dataKey="sell" stroke="hsl(346.8 77.2% 49.8%)" />
                <Line type="monotone" dataKey="others" stroke="hsl(47.9 95.8% 53.1%)" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}