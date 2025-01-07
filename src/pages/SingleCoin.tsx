import { useState } from "react";
import { useParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TimeInterval = "15m" | "1h" | "4h" | "1d";

const SingleCoin = () => {
  const { id } = useParams();
  const [interval, setInterval] = useState<TimeInterval>("1h");

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
      }));
    },
    refetchInterval: 30000,
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">
                {id}
              </h1>
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
                    <LineChart data={klines}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke="hsl(var(--primary))"
                        dot={false}
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