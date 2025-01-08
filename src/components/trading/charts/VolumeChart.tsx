import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CoinData } from "../types";

interface VolumeChartProps {
  coin: CoinData;
}

export function VolumeChart({ coin }: VolumeChartProps) {
  const chartData = coin.klines.map((kline) => ({
    time: new Date(kline.openTime).toLocaleTimeString(),
    volume: parseFloat(kline.volume),
  }));

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Volume</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="volume" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}