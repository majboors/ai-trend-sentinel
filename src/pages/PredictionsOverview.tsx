import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProfitLossCard } from "@/components/dashboard/ProfitLossCard";
import { CombinedPerformanceChart } from "@/components/dashboard/CombinedPerformanceChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  calculateTotalInitialAmount,
  calculateTotalProfits,
  calculateTotalLosses,
  calculateProfitPercentage,
  calculateLossPercentage,
} from "@/utils/predictionCalculations";

type PredictionView = Database['public']['Tables']['prediction_views']['Row'];
type PredictionTrade = Database['public']['Tables']['prediction_trades']['Row'];

export default function PredictionsOverview() {
  const [views, setViews] = useState<PredictionView[]>([]);
  const [trades, setTrades] = useState<PredictionTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [viewsResponse, tradesResponse] = await Promise.all([
        supabase
          .from('prediction_views')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('prediction_trades')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (viewsResponse.error) throw viewsResponse.error;
      if (tradesResponse.error) throw tradesResponse.error;

      setViews(viewsResponse.data || []);
      setTrades(tradesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch prediction data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalInitialAmount = calculateTotalInitialAmount(views);
  const totalProfits = calculateTotalProfits(trades);
  const totalLosses = calculateTotalLosses(trades);
  const profitPercentage = calculateProfitPercentage(trades, totalInitialAmount);
  const lossPercentage = calculateLossPercentage(trades, totalInitialAmount);

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">Predictions Overview</h1>
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
                  title="Total Initial Investment"
                  value={totalInitialAmount}
                  percentage={0}
                />
                <ProfitLossCard
                  title="Total Profits"
                  value={totalProfits}
                  percentage={profitPercentage}
                />
                <ProfitLossCard
                  title="Total Losses"
                  value={totalLosses}
                  percentage={lossPercentage}
                />
              </div>

              <CombinedPerformanceChart title="Overall Performance" />

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Active Predictions</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Initial Amount</TableHead>
                      <TableHead>Current Amount</TableHead>
                      <TableHead>Profit/Loss</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {views.map((view) => {
                      const profitLoss = Number(view.current_amount) - Number(view.initial_amount);
                      const percentage = (profitLoss / Number(view.initial_amount)) * 100;
                      
                      return (
                        <TableRow 
                          key={view.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/predictions/profits?view=${view.id}`)}
                        >
                          <TableCell>{view.name}</TableCell>
                          <TableCell>{new Date(view.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>${Number(view.initial_amount).toLocaleString()}</TableCell>
                          <TableCell>${Number(view.current_amount).toLocaleString()}</TableCell>
                          <TableCell className={profitLoss >= 0 ? "text-green-500" : "text-red-500"}>
                            {profitLoss >= 0 ? "+" : ""}{profitLoss.toLocaleString()} ({percentage.toFixed(2)}%)
                          </TableCell>
                          <TableCell className="capitalize">{view.status}</TableCell>
                        </TableRow>
                      );
                    })}
                    {views.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No prediction views yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}