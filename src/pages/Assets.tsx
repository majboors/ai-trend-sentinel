import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchBinanceBalances } from "@/lib/binance";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AssetsTable } from "@/components/assets/AssetsTable";
import { AssetsOverview } from "@/components/assets/AssetsOverview";
import { ApiKeysManager } from "@/components/assets/ApiKeysManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

const Assets = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hasApiKeys, setHasApiKeys] = useState<boolean | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your assets.",
          variant: "destructive",
        });
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate, toast]);

  // Check if user has API keys
  useEffect(() => {
    const checkApiKeys = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("api_keys")
        .select("binance_api_key")
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking API keys:", error);
        return;
      }

      setHasApiKeys(!!data?.binance_api_key);
    };

    checkApiKeys();
  }, []);

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      if (!hasApiKeys) return [];
      
      try {
        const binanceData = await fetchBinanceBalances();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('No authenticated session found');
        
        const { data, error } = await supabase
          .from("assets")
          .select("*")
          .eq('user_id', session.user.id)
          .order("symbol");

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching assets:", error);
        throw error;
      }
    },
    enabled: hasApiKeys === true,
    refetchInterval: 30000,
  });

  // Fetch transaction history
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated session found');

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq('user_id', session.user.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: hasApiKeys === true,
  });

  const spotAssets = assets?.filter((asset) => asset.account_type === "spot") || [];
  const marginAssets = assets?.filter((asset) => asset.account_type === "margin") || [];

  // Calculate total portfolio value and changes
  const calculateTotalValue = (assets: any[]) => {
    return assets.reduce((total, asset) => total + (asset.free + asset.locked), 0);
  };

  const totalSpotValue = calculateTotalValue(spotAssets);
  const totalMarginValue = calculateTotalValue(marginAssets);

  // Prepare data for profit/loss chart
  const profitData = transactions.map((trade) => ({
    date: new Date(trade.timestamp).toLocaleDateString(),
    value: trade.type === 'SELL' ? (trade.price * trade.amount) : -(trade.price * trade.amount)
  }));

  if (error) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar />
          <main className="flex-1 p-4 md:p-8">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Assets</h1>
                <SidebarTrigger className="md:hidden" />
              </div>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load assets. Please try refreshing the page.</AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl space-y-6">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold">Assets</h1>
              <SidebarTrigger className="md:hidden" />
            </div>

            <div className="mb-6">
              <ApiKeysManager />
            </div>

            {!hasApiKeys ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please add your Binance API keys above to view your assets.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Spot Value</CardTitle>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalSpotValue.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Margin Value</CardTitle>
                      <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalMarginValue.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Profit/Loss History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={profitData}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#22c55e" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="spot" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="spot">Spot Account</TabsTrigger>
                    <TabsTrigger value="margin">Margin Account</TabsTrigger>
                  </TabsList>

                  <TabsContent value="spot">
                    <Card>
                      <CardHeader>
                        <CardTitle>Spot Assets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AssetsTable assets={spotAssets} isLoading={isLoading} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="margin">
                    <Card>
                      <CardHeader>
                        <CardTitle>Margin Assets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AssetsTable assets={marginAssets} isLoading={isLoading} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Assets;