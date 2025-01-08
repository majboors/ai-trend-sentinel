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
  const buyTrades = coin.recentTrades
    .filter(trade => !trade.isBuyerMaker)
    .map((trade) => ({
      time: new Date(trade.time).toLocaleTimeString(),
      price: parseFloat(trade.price),
      quantity: parseFloat(trade.quantity),
    }));

  const sellTrades = coin.recentTrades
    .filter(trade => trade.isBuyerMaker)
    .map((trade) => ({
      time: new Date(trade.time).toLocaleTimeString(),
      price: parseFloat(trade.price),
      quantity: parseFloat(trade.quantity),
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
              name="Buy Trades"
              data={buyTrades}
              fill="#82ca9d"
            />
            <Scatter
              name="Sell Trades"
              data={sellTrades}
              fill="#ff7300"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}