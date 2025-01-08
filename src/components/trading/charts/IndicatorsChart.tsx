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

  const chartData = coin.klines.map((kline, index) => ({
    time: new Date(kline.openTime).toLocaleTimeString(),
    price: parseFloat(kline.close),
    ma7: coin.indicators.ma.ma7,
    ma25: coin.indicators.ma.ma25,
    ma99: coin.indicators.ma.ma99,
    rsi: coin.indicators.rsi,
  }));

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Technical Indicators</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ma7" stroke="#8884d8" name="MA7" />
            <Line type="monotone" dataKey="ma25" stroke="#82ca9d" name="MA25" />
            <Line type="monotone" dataKey="ma99" stroke="#ffc658" name="MA99" />
            <Line type="monotone" dataKey="rsi" stroke="#ff7300" name="RSI" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}