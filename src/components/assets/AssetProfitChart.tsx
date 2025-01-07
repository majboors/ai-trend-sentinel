import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Transaction {
  timestamp: string;
  price: number;
  amount: number;
  type: string;
}

interface AssetProfitChartProps {
  transactions: Transaction[];
}

export const AssetProfitChart = ({ transactions }: AssetProfitChartProps) => {
  const profitData = transactions.map(trade => ({
    date: new Date(trade.timestamp).toLocaleDateString(),
    value: trade.type === 'SELL' ? (trade.price * trade.amount) : -(trade.price * trade.amount)
  }));

  const chartConfig = {
    value: {
      theme: {
        light: "#dcfce7",
        dark: "#166534",
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit/Loss History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  fill="var(--color-value)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};