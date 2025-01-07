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
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const processTradesData = (trades: PredictionTrade[]) => {
    if (!trades || trades.length === 0) {
      console.log('No trades to process');
      return [];
    }

    // Sort trades by date first
    const sortedTrades = trades.sort((a, b) => 
      new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
    );

    // Group trades by date and calculate cumulative value
    let cumulative = 0;
    const groupedData = sortedTrades.reduce((acc: ChartData[], trade) => {
      if (!trade.created_at || trade.profit_loss === null || trade.profit_loss === undefined) {
        console.log('Invalid trade data:', trade);
        return acc;
      }

      const date = new Date(trade.created_at).toLocaleDateString();
      const profitLoss = Number(trade.profit_loss);

      if (isNaN(profitLoss)) {
        console.log('Invalid profit/loss value:', trade);
        return acc;
      }

      cumulative += profitLoss;
      
      const existingPoint = acc.find(point => point.date === date);
      if (existingPoint) {
        existingPoint.value = Number(cumulative.toFixed(2));
      } else {
        acc.push({
          date,
          value: Number(cumulative.toFixed(2))
        });
      }

      return acc;
    }, []);

    console.log('Processed chart data:', groupedData);
    return groupedData;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: trades, error } = await supabase
          .from('prediction_trades')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching trades:', error);
          throw error;
        }

        console.log('Fetched trades:', trades);
        
        if (!trades || trades.length === 0) {
          console.log('No trades found in database');
          setData([]);
          return;
        }

        const filteredTrades = filter ? trades.filter(filter) : trades;
        console.log('Filtered trades:', filteredTrades);

        const chartData = processTradesData(filteredTrades);
        console.log('Final chart data:', chartData);
        setData(chartData);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch performance data",
          variant: "destructive",
        });
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('prediction_trades_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prediction_trades'
        },
        async (payload) => {
          console.log('Received real-time update:', payload);
          fetchData(); // Refetch data on any changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, toast]);

  if (!data || data.length === 0) {
    console.log('No data available for rendering');
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No performance data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
              labelFormatter={(label) => `Date: ${label}`}
            />
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