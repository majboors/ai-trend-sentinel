import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { CoinData } from "./types";

interface CoinChartProps {
  coin: CoinData;
}

export function CoinChart({ coin }: CoinChartProps) {
  // Transform and validate klines data
  const chartData = coin.klines
    .filter(kline => kline && kline.openTime && kline.close && kline.volume)
    .map((kline) => ({
      time: new Date(kline.openTime).toLocaleTimeString(),
      price: parseFloat(kline.close),
      volume: parseFloat(kline.volume),
    }));

  if (chartData.length === 0) {
    return (
      <Card className="p-4">
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          No chart data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="price"
              orientation="right"
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="volume"
              orientation="left"
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="volume"
              type="monotone"
              dataKey="volume"
              stroke="#9333ea"
              dot={false}
              strokeWidth={1}
              opacity={0.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}