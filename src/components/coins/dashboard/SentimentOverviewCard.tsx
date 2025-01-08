import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SentimentData } from "../types";

interface SentimentOverviewCardProps {
  data: SentimentData | null;
  title: string;
  className?: string;
}

export function SentimentOverviewCard({ data, title, className }: SentimentOverviewCardProps) {
  const processData = () => {
    if (!data) return [];
    
    const sentiments = { buy: 0, sell: 0, others: 0 };
    Object.values(data.videos).forEach(video => {
      video.comments.forEach(comment => {
        sentiments[comment.indicator as keyof typeof sentiments]++;
      });
    });

    return Object.entries(sentiments).map(([key, value]) => ({
      sentiment: key.charAt(0).toUpperCase() + key.slice(1),
      count: value,
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processData()}>
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