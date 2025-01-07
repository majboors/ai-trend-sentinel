import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface PredictionData {
  symbol: string;
  profit_loss: number;
  type: string;
}

export const AssetsOverview = () => {
  const { toast } = useToast();
  const { data: predictions = [], isLoading, refetch } = useQuery({
    queryKey: ['prediction-trades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prediction_trades')
        .select(`
          *,
          prediction_views (
            name,
            initial_amount,
            current_amount
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('Fetched prediction trades:', data); // Debug log
      return data || [];
    }
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prediction_trades'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          refetch();
          toast({
            title: "Trading View Updated",
            description: "Latest profit/loss data has been refreshed.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

  // Prepare data for the charts - sort by profit/loss
  const profitTrades = predictions
    .filter((trade) => (trade.profit_loss || 0) > 0)
    .sort((a, b) => (b.profit_loss || 0) - (a.profit_loss || 0));

  const lossTrades = predictions
    .filter((trade) => (trade.profit_loss || 0) < 0)
    .sort((a, b) => (a.profit_loss || 0) - (b.profit_loss || 0));

  const profitData = profitTrades.map((trade) => ({
    name: trade.symbol,
    value: trade.profit_loss || 0,
  }));

  const lossData = lossTrades.map((trade) => ({
    name: trade.symbol,
    value: Math.abs(trade.profit_loss || 0),
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
          <CardTitle>Top Profitable Trades</CardTitle>
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
          <CardTitle>Largest Loss Trades</CardTitle>
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