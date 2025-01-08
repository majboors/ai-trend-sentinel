import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { processTradesData } from "@/utils/chartDataProcessing";
import { PerformanceChartView } from "./PerformanceChartView";

type PredictionTrade = Database['public']['Tables']['prediction_trades']['Row'];

interface CombinedPerformanceChartProps {
  title: string;
  viewId: string;
  filter?: (trade: PredictionTrade) => boolean;
}

export function CombinedPerformanceChart({ title, viewId, filter }: CombinedPerformanceChartProps) {
  const [data, setData] = useState<Array<{ date: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching trades data for viewId:', viewId);
        
        const { data: trades, error } = await supabase
          .from('prediction_trades')
          .select('*')
          .eq('view_id', viewId);

        if (error) {
          console.error('Error fetching trades:', error);
          throw error;
        }

        console.log('Raw trades data:', trades);
        
        if (!trades || trades.length === 0) {
          console.log('No trades found for view:', viewId);
          setData([]);
          return;
        }

        const chartData = processTradesData(trades, filter);
        console.log('Final chart data:', chartData);
        setData(chartData);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch performance data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (viewId) {
      fetchData();

      // Subscribe to real-time updates for the specific view
      const channel = supabase
        .channel(`prediction_trades_${viewId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'prediction_trades',
            filter: `view_id=eq.${viewId}`
          },
          (payload) => {
            console.log('Received real-time update for view:', viewId, payload);
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [viewId, filter, toast]);

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {data.length > 0 ? (
        <PerformanceChartView data={data} />
      ) : (
        <p className="text-center text-muted-foreground py-8">
          No performance data available for this view yet.
        </p>
      )}
    </Card>
  );
}