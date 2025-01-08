import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";

export default function SingleCoin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [latestPrice, setLatestPrice] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${id?.toLowerCase()}@trade`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLatestPrice(parseFloat(data.p));
    };

    return () => {
      ws.close();
    };
  }, [id]);

  const handleSaveTrade = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to save trades",
          variant: "destructive",
        });
        return;
      }

      // First, get or create a prediction view
      let viewId: string;
      const { data: existingView } = await supabase
        .from('prediction_views')
        .select('id, current_amount')
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
            name: 'Default Trading View',
            start_date: new Date().toISOString(),
            initial_amount: 1000,
            current_amount: 1000,
            status: 'active'
          })
          .select()
          .single();

        if (viewError) throw viewError;
        if (!newView) throw new Error('Failed to create prediction view');
        viewId = newView.id;
      }

      // Calculate profit/loss based on current price
      const profitLoss = calculateProfitLoss(latestPrice, amount);

      // Create the trade with all required fields
      const { data, error } = await supabase
        .from('prediction_trades')
        .insert({
          user_id: session.user.id,
          view_id: viewId,
          symbol: id,
          entry_price: latestPrice,
          amount: amount,
          type: 'BUY',
          status: 'open', // Changed from 'OPEN' to 'open' to match the enum type
          profit_loss: profitLoss
        })
        .select()
        .single();

      if (error) throw error;

      // Update the view's current amount
      const newAmount = (existingView?.current_amount || 1000) + profitLoss;
      await supabase
        .from('prediction_views')
        .update({ current_amount: newAmount })
        .eq('id', viewId);

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

  // Helper function to calculate profit/loss
  const calculateProfitLoss = (price: number, amount: number) => {
    return price * amount;
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{id}</h1>
              <p className="text-muted-foreground">
                Current Price: ${latestPrice.toFixed(2)}
              </p>
            </div>

            <div className="grid gap-6">
              <PerformanceChart />

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Trade</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Amount
                    </label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="Enter amount..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Value
                    </label>
                    <p className="text-2xl font-bold">
                      ${(latestPrice * amount).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveTrade}
                    disabled={amount <= 0}
                    className="w-full"
                  >
                    Save Trade
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}