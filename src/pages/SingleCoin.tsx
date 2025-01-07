import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TimeInterval = "15m" | "1h" | "4h" | "1d";

const SingleCoin = () => {
  const { id } = useParams();
  const [interval, setInterval] = useState<TimeInterval>("1h");
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: klines = [], isLoading } = useQuery({
    queryKey: ['klines', id, interval],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${id}&interval=${interval}&limit=100`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch kline data');
      }

      const data = await response.json();
      return data.map((item: any[]) => ({
        time: new Date(item[0]).toLocaleTimeString(),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
        ma7: 0,
        ma25: 0,
        ma99: 0,
      }));
    },
    refetchInterval: 30000,
  });

  const handleSaveTrade = async () => {
    try {
      const latestPrice = klines[klines.length - 1]?.close;
      if (!latestPrice || !id) {
        toast({
          title: "Error",
          description: "No price data available",
          variant: "destructive",
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Please login to save trades",
          variant: "destructive",
        });
        return;
      }

      // First, get or create a prediction view
      let viewId: string;
      const { data: existingView } = await supabase
        .from('prediction_views')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      if (existingView) {
        viewId = existingView.id;
      } else {
        // Create a new prediction view if none exists
        const { data: newView, error: viewError } = await supabase
          .from('prediction_views')
          .insert({
            user_id: session.user.id,
            name: 'Default View',
            start_date: new Date().toISOString(),
            initial_amount: 1000, // Default initial amount
            current_amount: 1000,
            status: 'active'
          })
          .select()
          .single();

        if (viewError) throw viewError;
        if (!newView) throw new Error('Failed to create prediction view');
        viewId = newView.id;
      }

      // Now create the trade with the view_id
      const { data, error } = await supabase
        .from('prediction_trades')
        .insert({
          user_id: session.user.id,
          view_id: viewId,
          symbol: id,
          entry_price: latestPrice,
          amount: 1, // Default amount
          type: 'BUY',
          status: 'OPEN'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trade saved successfully",
      });

      // Navigate to predictions overview
      navigate('/predictions');
    } catch (error) {
      console.error('Error saving trade:', error);
      toast({
        title: "Error",
        description: "Failed to save trade",
        variant: "destructive",
      });
    }
  };

  // Calculate moving averages
  const calculateMA = (data: any[], period: number) => {
    const result = [...data];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data
        .slice(i - period + 1, i + 1)
        .reduce((acc, curr) => acc + curr.close, 0);
      result[i][`ma${period}`] = sum / period;
    }
    return result;
  };

  const processedData = klines.length > 0
    ? calculateMA(calculateMA(calculateMA(klines, 7), 25), 99)
    : [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {id}
                </h1>
                <Button
                  onClick={handleSaveTrade}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Save Trade
                </Button>
              </div>
              <div className="flex gap-2">
                {(['15m', '1h', '4h', '1d'] as TimeInterval[]).map((t) => (
                  <Button
                    key={t}
                    variant={interval === t ? "default" : "outline"}
                    onClick={() => setInterval(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <Card className="p-6">
              {isLoading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke="hsl(var(--primary))"
                        dot={false}
                        name="Price"
                      />
                      <Line
                        type="monotone"
                        dataKey="ma7"
                        stroke="#22c55e"
                        dot={false}
                        name="MA7"
                      />
                      <Line
                        type="monotone"
                        dataKey="ma25"
                        stroke="#eab308"
                        dot={false}
                        name="MA25"
                      />
                      <Line
                        type="monotone"
                        dataKey="ma99"
                        stroke="#ef4444"
                        dot={false}
                        name="MA99"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SingleCoin;