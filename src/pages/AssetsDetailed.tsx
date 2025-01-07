import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AssetsAnalytics } from "@/components/assets/AssetsAnalytics";
import { AssetValueCards } from "@/components/assets/AssetValueCards";
import { AssetProfitChart } from "@/components/assets/AssetProfitChart";
import { AssetDistributionChart } from "@/components/assets/AssetDistributionChart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const AssetsDetailed = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
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

  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      try {
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
    refetchInterval: 30000,
  });

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
  });

  const spotAssets = assets.filter((asset) => asset.account_type === "spot");
  const marginAssets = assets.filter((asset) => asset.account_type === "margin");

  const calculateTotalValue = (assets: any[]) => {
    return assets.reduce((total, asset) => total + (asset.free + asset.locked), 0);
  };

  const totalSpotValue = calculateTotalValue(spotAssets);
  const totalMarginValue = calculateTotalValue(marginAssets);

  if (error) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar />
          <main className="flex-1 p-4 md:p-8">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Assets Analytics</h1>
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
              <h1 className="text-2xl md:text-3xl font-bold">Assets Analytics</h1>
              <SidebarTrigger className="md:hidden" />
            </div>

            <AssetValueCards
              totalSpotValue={totalSpotValue}
              totalMarginValue={totalMarginValue}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <AssetDistributionChart
                assets={spotAssets}
                title="Spot Assets Distribution"
              />
              <AssetDistributionChart
                assets={marginAssets}
                title="Margin Assets Distribution"
              />
            </div>

            <AssetProfitChart transactions={transactions} />
            
            <AssetsAnalytics />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AssetsDetailed;