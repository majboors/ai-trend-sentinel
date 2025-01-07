import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProfitLossCard } from "@/components/dashboard/ProfitLossCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";

interface PredictionSettings {
  startDate: string;
  initialAmount: number;
  startedAt: string;
}

export default function ProfitPredictions() {
  const [settings, setSettings] = useState<PredictionSettings | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedSettings = localStorage.getItem('predictionSettings');
    if (!savedSettings) {
      toast({
        title: "No settings found",
        description: "Please configure prediction settings first",
        variant: "destructive",
      });
      navigate('/predictions/settings');
      return;
    }
    setSettings(JSON.parse(savedSettings));
  }, [navigate, toast]);

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">Profit Predictions</h1>
              <Button
                variant="outline"
                onClick={() => navigate('/predictions/settings')}
              >
                Settings
              </Button>
            </div>

            {settings && (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ProfitLossCard
                    title="Initial Investment"
                    value={settings.initialAmount}
                    percentage={0}
                  />
                  <ProfitLossCard
                    title="Current Profit"
                    value={1234.56}
                    percentage={12.34}
                  />
                  <ProfitLossCard
                    title="Predicted EOD Profit"
                    value={2345.67}
                    percentage={23.45}
                  />
                </div>
                <Card className="p-6">
                  <PerformanceChart />
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}