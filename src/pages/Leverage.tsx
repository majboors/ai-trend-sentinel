import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface LeverageData {
  symbol: string;
  leverage: number;
  debt: number;
  equity: number;
  baseAsset: {
    asset: string;
    borrowed: string;
    free: string;
  };
  quoteAsset: {
    asset: string;
    borrowed: string;
    free: string;
  };
}

const Leverage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasApiKeys, setHasApiKeys] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view leverage information.",
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

  const { data: leverageData, isLoading, error } = useQuery({
    queryKey: ["leverage"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No authenticated session found");

      const response = await supabase.functions.invoke('fetch-binance-margin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data as LeverageData[];
    },
    enabled: hasApiKeys === true,
    refetchInterval: 30000,
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold">Leverage</h1>
              <SidebarTrigger className="md:hidden" />
            </div>

            {!hasApiKeys ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please add your Binance API keys to view leverage information.
                </AlertDescription>
              </Alert>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load leverage data. Please try again later.
                </AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Isolated Margin Leverage</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : !leverageData?.length ? (
                    <p className="text-muted-foreground">No leverage positions found.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trading Pair</TableHead>
                          <TableHead className="text-right">Leverage</TableHead>
                          <TableHead className="text-right">Debt</TableHead>
                          <TableHead className="text-right">Equity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leverageData.map((item) => (
                          <TableRow key={item.symbol}>
                            <TableCell className="font-medium">{item.symbol}</TableCell>
                            <TableCell className="text-right">
                              {typeof item.leverage === 'number' ? `${item.leverage.toFixed(2)}x` : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              {typeof item.debt === 'number' ? item.debt.toFixed(8) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              {typeof item.equity === 'number' ? item.equity.toFixed(8) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Leverage;