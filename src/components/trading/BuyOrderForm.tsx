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
  const [targetProfit, setTargetProfit] = useState<number>(5);
  const [leverage, setLeverage] = useState<number>(1);
  const [marketSellPrice, setMarketSellPrice] = useState<number>(currentPrice);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetPrice = marketSellPrice || (currentPrice * (1 + targetProfit / 100));
  const stopLossPrice = currentPrice - 2 / amount;

  const quoteAsset = symbol.replace(/BTC$|USDT$|ETH$/, "");
  const baseAsset = "USDT"; // Always show in USDT
  
  const availableBalance = availableAssets.find(
    asset => asset.symbol === baseAsset
  )?.free || 0;

  const maxAmount = availableBalance / currentPrice;
  const leveragedAmount = amount * leverage;
  const loanedAmount = leveragedAmount - amount;
  const depth = (leveragedAmount * currentPrice) / availableBalance;

  const potentialProfit = (targetPrice - currentPrice) * leveragedAmount;
  const profitPercentage = ((targetPrice - currentPrice) / currentPrice) * 100 * leverage;

  const handleSliderChange = (values: number[]) => {
    const percentage = values[0];
    const calculatedAmount = (maxAmount * percentage) / 100;
    setAmount(calculatedAmount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: ipData, error: ipError } = await supabase.functions.invoke('fetch-ip');
      if (ipError) throw ipError;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to place orders");
      }

      const { error: orderError } = await supabase
        .from('buy_orders')
        .insert({
          user_id: session.user.id,
          symbol,
          entry_price: currentPrice,
          target_price: targetPrice,
          stop_loss_price: stopLossPrice,
          amount: leveragedAmount,
          ip_address: ipData.ip,
          leverage,
          status: 'pending'
        });

      if (orderError) throw orderError;

      toast({
        title: "Order placed successfully",
        description: `Buy order for ${leveragedAmount} ${quoteAsset} at ${currentPrice} ${baseAsset}`,
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
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Available Balance</Label>
            <span className="text-sm font-medium">
              {availableBalance.toFixed(2)} {baseAsset}
            </span>
          </div>
          
          <div className="space-y-2">
            <Label>Purchase Amount ({quoteAsset})</Label>
            <Slider
              value={[amount ? (amount / maxAmount) * 100 : 0]}
              onValueChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
              className="my-4"
            />
            <div className="flex justify-between text-sm">
              <span>0 {quoteAsset}</span>
              <span>{maxAmount.toFixed(8)} {quoteAsset}</span>
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              max={maxAmount}
              step="0.0001"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground">
              Cost: {(amount * currentPrice).toFixed(2)} {baseAsset}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Leverage (x)</Label>
            <Slider
              value={[leverage]}
              onValueChange={(values) => setLeverage(values[0])}
              min={1}
              max={10}
              step={1}
              className="my-4"
            />
            <div className="flex justify-between text-sm">
              <span>Loaned: {(loanedAmount * currentPrice).toFixed(2)} {baseAsset}</span>
              <span>Depth: {depth.toFixed(2)}x</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Market Sell Price ({baseAsset})</Label>
            <Input
              type="number"
              value={marketSellPrice}
              onChange={(e) => setMarketSellPrice(Number(e.target.value))}
              min={0}
              step="0.0001"
              className="mt-2"
            />
            <div className="flex justify-between text-sm">
              <span>Profit: {potentialProfit.toFixed(2)} {baseAsset}</span>
              <span>({profitPercentage.toFixed(2)}%)</span>
            </div>
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
              <span>Target Price: {targetPrice.toFixed(2)} {baseAsset}</span>
              <span>Profit: {(targetPrice * leveragedAmount - currentPrice * leveragedAmount).toFixed(2)} {baseAsset}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stop Loss</Label>
            <p className="text-sm text-muted-foreground">
              Fixed at $2 loss: {stopLossPrice.toFixed(2)} {baseAsset}
            </p>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || amount <= 0}>
          {isLoading ? "Placing Order..." : "Place Buy Order"}
        </Button>
      </form>
    </div>
  );
}