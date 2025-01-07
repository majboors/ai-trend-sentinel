import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { processTradesData } from "@/utils/chartDataProcessing";
import { PerformanceChartView } from "./PerformanceChartView";

type PredictionTrade = Database['public']['Tables']['prediction_trades']['Row'];

interface CombinedPerformanceChartProps {
  title: string;
  filter?: (trade: PredictionTrade) => boolean;
}

export function CombinedPerformanceChart({ title, filter }: CombinedPerformanceChartProps) {
  const [data, setData] = useState<Array<{ date: string; value: number }>>([]);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get('view');

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching trades data for viewId:', viewId);
        let query = supabase
          .from('prediction_trades')
          .select('*');

        if (viewId) {
          query = query.eq('view_id', viewId);
        }

        const { data: trades, error } = await query;

        if (error) {
          console.error('Error fetching trades:', error);
          throw error;
        }

        console.log('Raw trades data:', trades);
        
        if (!trades || trades.length === 0) {
          console.log('No trades found in database');
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
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, toast, viewId]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <PerformanceChartView data={data} />
    </Card>
  );
}