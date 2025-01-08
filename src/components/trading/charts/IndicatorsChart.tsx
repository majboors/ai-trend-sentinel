import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CoinData } from "../types";

interface IndicatorsChartProps {
  coin: CoinData;
}

export function IndicatorsChart({ coin }: IndicatorsChartProps) {
  if (!coin.klines || !Array.isArray(coin.klines) || coin.klines.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Technical Indicators</h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          No indicator data available
        </div>
      </Card>
    );
  }

  // Calculate moving averages for each point in time
  const chartData = coin.klines.map((kline, index, array) => {
    const currentPrice = parseFloat(kline.close);
    
    // Calculate MA7
    const ma7Prices = array.slice(Math.max(0, index - 6), index + 1)
      .map(k => parseFloat(k.close));
    const ma7 = ma7Prices.reduce((sum, price) => sum + price, 0) / ma7Prices.length;

    // Calculate MA25
    const ma25Prices = array.slice(Math.max(0, index - 24), index + 1)
      .map(k => parseFloat(k.close));
    const ma25 = ma25Prices.reduce((sum, price) => sum + price, 0) / ma25Prices.length;

    // Calculate MA99
    const ma99Prices = array.slice(Math.max(0, index - 98), index + 1)
      .map(k => parseFloat(k.close));
    const ma99 = ma99Prices.reduce((sum, price) => sum + price, 0) / ma99Prices.length;

    return {
      time: new Date(kline.openTime).toLocaleTimeString(),
      price: currentPrice,
      ma7,
      ma25,
      ma99,
      rsi: coin.indicators.rsi,
    };
  });

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Technical Indicators</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
            <Legend />
            <Line 
              type="monotone" 
              dataKey="ma7" 
              stroke="#8884d8" 
              name="MA7" 
              dot={false}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="ma25" 
              stroke="#82ca9d" 
              name="MA25" 
              dot={false}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="ma99" 
              stroke="#ffc658" 
              name="MA99" 
              dot={false}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="rsi" 
              stroke="#ff7300" 
              name="RSI" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}