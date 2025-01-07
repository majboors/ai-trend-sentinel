import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PredictionData {
  symbol: string;
  profit_loss: number;
  type: string;
}

export const AssetsOverview = () => {
  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['prediction-trades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prediction_trades')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Prepare data for the charts
  const profitTrades = predictions.filter((trade) => (trade.profit_loss || 0) > 0);
  const lossTrades = predictions.filter((trade) => (trade.profit_loss || 0) < 0);

  const profitData = profitTrades.map((trade) => ({
    name: trade.symbol,
    value: trade.profit_loss || 0,
  }));

  const lossData = lossTrades.map((trade) => ({
    name: trade.symbol,
    value: Math.abs(trade.profit_loss || 0), // Use absolute value for better visualization
  }));

  const chartConfig = {
    value: {
      theme: {
        light: "#dcfce7",
        dark: "#166534",
      }
    }
  };

  if (isLoading) {
    return <div className="h-[400px] animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profitable Trades Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
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

      <Card>
        <CardHeader>
          <CardTitle>Loss Trades Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lossData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ef4444"
                    fill="var(--color-value)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};