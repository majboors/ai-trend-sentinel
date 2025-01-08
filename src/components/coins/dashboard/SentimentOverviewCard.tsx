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
    let totalComments = 0;
    
    try {
      Object.entries(data).forEach(([_, coinData]) => {
        if (coinData?.videos) {
          Object.values(coinData.videos).forEach(video => {
            if (video?.comments) {
              video.comments.forEach(comment => {
                totalComments++;
                if (comment.indicator === 'buy') sentiments.buy++;
                else if (comment.indicator === 'sell') sentiments.sell++;
                else sentiments.others++;
              });
            }
          });
        }
      });

      // Convert to percentages
      return Object.entries(sentiments).map(([key, value]) => ({
        sentiment: key.charAt(0).toUpperCase() + key.slice(1),
        percentage: totalComments > 0 ? (value / totalComments) * 100 : 0,
        count: value,
      }));
    } catch (error) {
      console.error('Error processing sentiment data:', error);
      return [];
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
  console.log('Overall Market Sentiment Data:', chartData);

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
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Percentage']}
                />
                <Bar 
                  dataKey="percentage"
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