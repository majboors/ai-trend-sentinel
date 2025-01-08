import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { SentimentData } from "../types";

interface SentimentTrendCardProps {
  data: SentimentData | null;
  title: string;
}

export function SentimentTrendCard({ data, title }: SentimentTrendCardProps) {
  const processData = () => {
    if (!data) return [];
    
    const timelineData: Record<string, { buy: number; sell: number; others: number }> = {};
    Object.values(data.videos).forEach(video => {
      video.comments.forEach(comment => {
        const date = new Date().toLocaleDateString(); // You might want to use actual dates from the API
        if (!timelineData[date]) {
          timelineData[date] = { buy: 0, sell: 0, others: 0 };
        }
        timelineData[date][comment.indicator as keyof typeof timelineData[string]]++;
      });
    });

    return Object.entries(timelineData).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  };

  return (
    <Card className="col-span-3">
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