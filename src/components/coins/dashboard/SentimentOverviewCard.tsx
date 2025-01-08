import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SentimentData } from "../types";
import { Loader2 } from "lucide-react";

interface SentimentOverviewCardProps {
  data: { [key: string]: SentimentData } | null;
  title: string;
  className?: string;
}

export function SentimentOverviewCard({ data, title, className }: SentimentOverviewCardProps) {
  const processData = () => {
    if (!data) return [];
    
    const sentiments = { buy: 0, sell: 0, others: 0 };
    
    try {
      Object.entries(data).forEach(([_, coinData]) => {
        if (coinData?.videos) {
          Object.values(coinData.videos).forEach(video => {
            if (video?.comments) {
              video.comments.forEach(comment => {
                if (comment.indicator === 'buy') sentiments.buy++;
                else if (comment.indicator === 'sell') sentiments.sell++;
                else sentiments.others++;
              });
            }
          });
        }
      });

      return Object.entries(sentiments).map(([key, value]) => ({
        sentiment: key.charAt(0).toUpperCase() + key.slice(1),
        count: value,
      }));
    } catch (error) {
      console.error('Error processing sentiment data:', error);
      return [];
    }
  };

  const chartData = processData();

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
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sentiment" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}