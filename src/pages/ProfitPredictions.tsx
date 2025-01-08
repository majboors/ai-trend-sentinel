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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";

type PredictionView = Database['public']['Tables']['prediction_views']['Row'];
type PredictionTrade = Database['public']['Tables']['prediction_trades']['Row'];

interface CoinProfit {
  symbol: string;
  initialPrice: number;
  currentPrice: number;
  potentialProfit: number;
  profitPercentage: number;
}

export default function ProfitPredictions() {
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get('view');
  const [view, setView] = useState<PredictionView | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: viewData } = useQuery({
    queryKey: ['prediction-view', viewId],
    queryFn: async () => {
      if (!viewId) return null;
      const { data, error } = await supabase
        .from('prediction_views')
        .select('*')
        .eq('id', viewId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!viewId,
  });

  const { data: coinProfits = [] } = useQuery({
    queryKey: ['coin-profits', viewId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await supabase.functions.invoke('fetch-binance-pairs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      const coins = response.data;
      if (!viewData) return [];

      const profits: CoinProfit[] = coins.map((coin: any) => {
        const initialInvestment = Number(viewData.initial_amount);
        const currentPrice = parseFloat(coin.lastPrice);
        const priceChange = parseFloat(coin.priceChangePercent);
        const initialPrice = currentPrice / (1 + priceChange / 100);
        const coinsAmount = initialInvestment / initialPrice;
        const currentValue = coinsAmount * currentPrice;
        const potentialProfit = currentValue - initialInvestment;
        const profitPercentage = (potentialProfit / initialInvestment) * 100;

        return {
          symbol: coin.symbol,
          initialPrice,
          currentPrice,
          potentialProfit,
          profitPercentage,
        };
      });

      return profits.sort((a, b) => b.potentialProfit - a.potentialProfit);
    },
    enabled: !!viewData,
  });

  useEffect(() => {
    if (!viewId) {
      navigate('/predictions');
      return;
    }
    if (viewData) {
      setView(viewData);
    }
  }, [viewId, navigate, viewData]);

  if (!view || !viewId) return null;

  const totalProfit = coinProfits.reduce((sum, coin) => sum + coin.potentialProfit, 0);
  const averageProfitPercentage = coinProfits.reduce((sum, coin) => sum + coin.profitPercentage, 0) / coinProfits.length;

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{view.name} - Profits Analysis</h1>
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
                  title="Potential Total Profits"
                  value={totalProfit}
                  percentage={averageProfitPercentage}
                />
                <ProfitLossCard
                  title="Profitable Coins"
                  value={coinProfits.filter(coin => coin.potentialProfit > 0).length}
                  percentage={0}
                />
              </div>

              <CombinedPerformanceChart 
                title="Profit Performance" 
                viewId={viewId}
                filter={(trade) => Number(trade.profit_loss) > 0}
              />

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Coins Profit Analysis</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Initial Price</TableHead>
                        <TableHead>Current Price</TableHead>
                        <TableHead>Potential Profit</TableHead>
                        <TableHead>Profit %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coinProfits.map((coin) => (
                        <TableRow
                          key={coin.symbol}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/coins/${coin.symbol}`)}
                        >
                          <TableCell className="font-medium">{coin.symbol}</TableCell>
                          <TableCell>${coin.initialPrice.toFixed(8)}</TableCell>
                          <TableCell>${coin.currentPrice.toFixed(8)}</TableCell>
                          <TableCell className={coin.potentialProfit >= 0 ? "text-green-500" : "text-red-500"}>
                            ${Math.abs(coin.potentialProfit).toFixed(2)}
                          </TableCell>
                          <TableCell className={coin.profitPercentage >= 0 ? "text-green-500" : "text-red-500"}>
                            {coin.profitPercentage.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}