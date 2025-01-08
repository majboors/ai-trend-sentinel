import { Card } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CoinData } from "../types";

interface RecentTradesChartProps {
  coin: CoinData;
}

export function RecentTradesChart({ coin }: RecentTradesChartProps) {
  const chartData = coin.recentTrades.map((trade) => ({
    time: new Date(trade.time).toLocaleTimeString(),
    price: parseFloat(trade.price),
    quantity: parseFloat(trade.quantity),
    type: trade.isBuyerMaker ? "sell" : "buy",
  }));

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Recent Trades</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <XAxis dataKey="time" />
            <YAxis dataKey="price" />
            <Tooltip />
            <Scatter
              name="Trades"
              data={chartData}
              fill={(entry) => (entry.type === "buy" ? "#82ca9d" : "#ff7300")}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}