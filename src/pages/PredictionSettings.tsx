import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function PredictionSettings() {
  const [startDate, setStartDate] = useState<string>("");
  const [initialAmount, setInitialAmount] = useState<string>("1000");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStartPrediction = () => {
    if (!startDate || !initialAmount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('predictionSettings', JSON.stringify({
      startDate,
      initialAmount: parseFloat(initialAmount),
      startedAt: new Date().toISOString(),
    }));

    toast({
      title: "Success",
      description: "Prediction settings saved. Starting simulation...",
    });

    navigate('/predictions/profits');
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Prediction Settings</h1>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialAmount">Initial Amount (USD)</Label>
                  <Input
                    id="initialAmount"
                    type="number"
                    min="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleStartPrediction}
                >
                  Start Prediction
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}