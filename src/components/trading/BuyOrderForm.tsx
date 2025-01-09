import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BuyOrderFormProps {
  symbol: string;
  currentPrice: number;
  availableAssets: {
    symbol: string;
    free: number;
  }[];
  onSuccess?: () => void;
}

export function BuyOrderForm({ symbol, currentPrice, availableAssets, onSuccess }: BuyOrderFormProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(0);
  const [targetProfit, setTargetProfit] = useState<number>(5); // Default 5% profit target
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetPrice = currentPrice * (1 + targetProfit / 100);
  const stopLossPrice = currentPrice - 2 / amount; // $2 fixed stop loss

  const quoteAsset = symbol.replace(/BTC$|USDT$|ETH$/, "");
  const baseAsset = symbol.includes("USDT") ? "USDT" : symbol.includes("BTC") ? "BTC" : "ETH";
  
  const availableBalance = availableAssets.find(
    asset => asset.symbol === baseAsset
  )?.free || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get user's IP address
      const { data: ipData, error: ipError } = await supabase.functions.invoke('fetch-ip');
      if (ipError) throw ipError;

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to place orders");
      }

      // Create buy order
      const { error: orderError } = await supabase
        .from('buy_orders')
        .insert({
          user_id: session.user.id,
          symbol,
          entry_price: currentPrice,
          target_price: targetPrice,
          stop_loss_price: stopLossPrice,
          amount,
          ip_address: ipData.ip,
          leverage: 1, // Default leverage
          status: 'pending'
        });

      if (orderError) throw orderError;

      toast({
        title: "Order placed successfully",
        description: `Buy order for ${amount} ${quoteAsset} at ${currentPrice} ${baseAsset}`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error placing order:', err);
      setError(err.message);
      toast({
        title: "Error placing order",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Amount ({quoteAsset})</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={0}
            step="0.0001"
            placeholder={`Enter amount in ${quoteAsset}`}
          />
          <p className="text-sm text-muted-foreground">
            Available: {availableBalance.toFixed(8)} {baseAsset}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Target Profit (%)</Label>
          <Slider
            value={[targetProfit]}
            onValueChange={(values) => setTargetProfit(values[0])}
            min={1}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-sm">
            <span>Target Price: {targetPrice.toFixed(8)} {baseAsset}</span>
            <span>Profit: {(targetPrice * amount - currentPrice * amount).toFixed(8)} {baseAsset}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Stop Loss</Label>
          <p className="text-sm text-muted-foreground">
            Fixed at $2 loss: {stopLossPrice.toFixed(8)} {baseAsset}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Leverage Available</Label>
          <p className="text-sm text-muted-foreground">
            Up to 10x leverage available for this pair
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || amount <= 0}>
          {isLoading ? "Placing Order..." : "Place Buy Order"}
        </Button>
      </form>
    </Card>
  );
}