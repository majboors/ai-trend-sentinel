import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProfitLossCard } from "@/components/dashboard/ProfitLossCard";
import { CombinedPerformanceChart } from "@/components/dashboard/CombinedPerformanceChart";
import { supabase } from "@/integrations/supabase/client";
import { sendTradeNotification } from "@/utils/notificationService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

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

      const profits = coins.map((coin: any) => {
        const initialInvestment = Number(viewData.initial_amount);
        const currentPrice = parseFloat(coin.lastPrice);
        const priceChange = parseFloat(coin.priceChangePercent);
        const initialPrice = currentPrice / (1 + priceChange / 100);
        const coinsAmount = initialInvestment / initialPrice;
        const currentValue = coinsAmount * currentPrice;
        const potentialProfit = currentValue - initialInvestment;
        const profitPercentage = (potentialProfit / initialInvestment) * 100;

        // Send notification if price change is significant (more than 1%)
        if (Math.abs(profitPercentage) > 1 && viewData) {
          sendTradeNotification(
            coin.symbol,
            profitPercentage > 0 ? 'UP' : 'DOWN',
            Math.abs(profitPercentage),
            viewData.name,
            potentialProfit
          );
        }

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
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Function to store trades in Supabase
  const storeTrade = async ({
    viewId,
    userId,
    symbol,
    entryPrice,
    exitPrice,
    amount,
    profitLoss,
    type
  }: {
    viewId: string;
    userId: string;
    symbol: string;
    entryPrice: number;
    exitPrice: number;
    amount: number;
    profitLoss: number;
    type: 'buy' | 'sell';  // Added type definition
  }) => {
    try {
      console.log('Storing trade with values:', {
        viewId,
        userId,
        symbol,
        entryPrice,
        exitPrice,
        amount,
        profitLoss,
        type,
        status: 'open'
      });

      const { error } = await supabase
        .from('prediction_trades')
        .insert({
          view_id: viewId,
          user_id: userId,
          symbol,
          entry_price: entryPrice,
          exit_price: exitPrice,
          amount,
          profit_loss: profitLoss,
          type,
          status: 'open'
        });

      if (error) {
        console.error('Error storing trade:', error);
        return;
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['prediction-trades', viewId] });
    } catch (error) {
      console.error('Error storing trade:', error);
    }
  };

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

  // Get top 10 most profitable coins
  const top10Profits = coinProfits.slice(0, 10);
  const totalProfit = top10Profits.reduce((sum, coin) => sum + coin.potentialProfit, 0);
  const averageProfitPercentage = top10Profits.reduce((sum, coin) => sum + coin.profitPercentage, 0) / top10Profits.length;

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{view.name} - Top 10 Profitable Coins</h1>
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
                  title="Top 10 Total Profits"
                  value={totalProfit}
                  percentage={averageProfitPercentage}
                />
                <ProfitLossCard
                  title="Profitable Coins"
                  value={coinProfits.filter(coin => coin.potentialProfit > 0).length}
                  percentage={(coinProfits.filter(coin => coin.potentialProfit > 0).length / coinProfits.length) * 100}
                />
              </div>

              <CombinedPerformanceChart 
                title="Profit Performance" 
                viewId={viewId}
                filter={(trade) => Number(trade.profit_loss) > 0}
              />

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Top 10 Most Profitable Coins</h2>
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
                      {top10Profits.map((coin) => (
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
