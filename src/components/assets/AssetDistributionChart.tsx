import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";

interface Asset {
  symbol: string;
  free: number;
  locked: number;
}

interface AssetDistributionChartProps {
  assets: Asset[];
  title: string;
}

export const AssetDistributionChart = ({ assets, title }: AssetDistributionChartProps) => {
  const COLORS = ['#22c55e', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6'];

  const data = assets.map((asset, index) => ({
    name: asset.symbol,
    value: asset.free + asset.locked,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};