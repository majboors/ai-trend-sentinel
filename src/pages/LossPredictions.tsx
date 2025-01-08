import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProfitLossCard } from "@/components/dashboard/ProfitLossCard";
import { CombinedPerformanceChart } from "@/components/dashboard/CombinedPerformanceChart";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PredictionView = Database['public']['Tables']['prediction_views']['Row'];
type PredictionTrade = Database['public']['Tables']['prediction_trades']['Row'];

export default function LossPredictions() {
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get('view');
  const [view, setView] = useState<PredictionView | null>(null);
  const [trades, setTrades] = useState<PredictionTrade[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!viewId) {
      navigate('/predictions');
      return;
    }
    fetchViewData();
  }, [viewId, navigate]);

  const fetchViewData = async () => {
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('prediction_views')
        .select('*')
        .eq('id', viewId)
        .single();

      if (viewError) throw viewError;
      setView(viewData);

      // Only fetch loss trades
      const { data: tradesData, error: tradesError } = await supabase
        .from('prediction_trades')
        .select('*')
        .eq('view_id', viewId)
        .lt('profit_loss', 0)
        .order('created_at', { ascending: false });

      if (tradesError) throw tradesError;
      setTrades(tradesData || []);
    } catch (error) {
      console.error('Error fetching view data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch prediction data",
        variant: "destructive",
      });
    }
  };

  if (!view || !viewId) return null;

  const totalLoss = trades.reduce((sum, trade) => sum + Number(trade.profit_loss || 0), 0);
  const lossPercentage = (totalLoss / Number(view.initial_amount)) * 100;

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{view.name} - Losses</h1>
                <p className="text-muted-foreground">
                  Started on {new Date(view.start_date).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/predictions/settings')}
              >
                Settings
              </Button>
            </div>

            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ProfitLossCard
                  title="Initial Investment"
                  value={Number(view.initial_amount)}
                  percentage={0}
                />
                <ProfitLossCard
                  title="Total Losses"
                  value={totalLoss}
                  percentage={lossPercentage}
                />
                <ProfitLossCard
                  title="Loss Trades"
                  value={trades.length}
                  percentage={0}
                />
              </div>

              <CombinedPerformanceChart 
                title="Loss Performance" 
                viewId={viewId}
                filter={(trade) => Number(trade.profit_loss) < 0}
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}