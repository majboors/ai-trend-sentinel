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
import { VolumeChart } from "./charts/VolumeChart";
import { IndicatorsChart } from "./charts/IndicatorsChart";
import { RecentTradesChart } from "./charts/RecentTradesChart";
import type { CoinData } from "./types";

interface CoinChartProps {
  coin: CoinData;
}

export function CoinChart({ coin }: CoinChartProps) {
  // Ensure we have valid klines data
  const hasValidKlines = coin?.klines && Array.isArray(coin.klines) && coin.klines.length > 0;
  
  if (!hasValidKlines) {
    console.log('No valid klines data found:', coin);
    return (
      <Card className="p-4">
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          Loading chart data...
        </div>
      </Card>
    );
  }

  const chartData = coin.klines
    .filter(kline => kline && kline.openTime && kline.close)
    .map((kline) => ({
      time: new Date(kline.openTime).toLocaleTimeString(),
      price: parseFloat(kline.close),
      volume: parseFloat(kline.volume),
    }));

  if (chartData.length === 0) {
    console.log('No valid chart data after processing:', coin.klines);
    return (
      <Card className="p-4">
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          Processing chart data...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Price Chart</h3>
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
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#2563eb"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <VolumeChart coin={coin} />
      <IndicatorsChart coin={coin} />
      <RecentTradesChart coin={coin} />
    </div>
  );
}