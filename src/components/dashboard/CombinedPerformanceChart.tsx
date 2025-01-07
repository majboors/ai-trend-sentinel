import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PredictionTrade = Database['public']['Tables']['prediction_trades']['Row'];

interface ChartData {
  date: string;
  value: number;
}

interface CombinedPerformanceChartProps {
  title: string;
  filter?: (trade: PredictionTrade) => boolean;
}

export function CombinedPerformanceChart({ title, filter }: CombinedPerformanceChartProps) {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: trades, error } = await supabase
          .from('prediction_trades')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        const filteredTrades = filter ? trades.filter(filter) : trades;
        
        // Group trades by date and calculate cumulative value
        const groupedData = filteredTrades.reduce((acc: ChartData[], trade) => {
          const date = new Date(trade.created_at).toLocaleDateString();
          const existingPoint = acc.find(point => point.date === date);

          if (existingPoint) {
            existingPoint.value += Number(trade.profit_loss || 0);
          } else {
            acc.push({
              date,
              value: Number(trade.profit_loss || 0)
            });
          }

          return acc;
        }, []);

        // Calculate cumulative values
        let cumulative = 0;
        const chartData = groupedData.map(point => {
          cumulative += point.value;
          return {
            date: point.date,
            value: cumulative
          };
        });

        setData(chartData);
      } catch (error) {
        console.error('Error fetching performance data:', error);
      }
    };

    fetchData();
  }, [filter]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}