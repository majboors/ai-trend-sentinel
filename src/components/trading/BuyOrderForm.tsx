import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface BuyOrderFormProps {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  currentPrice: number;
}

export function BuyOrderForm({
  symbol,
  baseAsset,
  quoteAsset,
  currentPrice,
}: BuyOrderFormProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(0);
  const [leverage, setLeverage] = useState(1);
  const [targetPrice, setTargetPrice] = useState(currentPrice);
  const [loading, setLoading] = useState(false);

  // Get available balance
  const availableBalance = parseFloat(
    localStorage.getItem(`balance_${quoteAsset}`) || "0"
  );

  const maxAmount = availableBalance / currentPrice;

  // Auto-adjust leverage when amount exceeds available balance
  useEffect(() => {
    const requiredLeverage = Math.ceil(amount / maxAmount);
    if (requiredLeverage > 1) {
      setLeverage(Math.min(requiredLeverage, 10)); // Cap at max leverage of 10
    }
  }, [amount, maxAmount]);

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

  const handleAmountChange = (value: number) => {
    setAmount(value);
    // Auto-adjust leverage if amount exceeds available balance
    if (value > maxAmount) {
      const newLeverage = Math.min(Math.ceil(value / maxAmount), 10);
      setLeverage(newLeverage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderDetails = {
        symbol: symbol,
        side: "BUY",
        type: "LIMIT",
        quantity: amount.toFixed(8),
        price: currentPrice.toFixed(8),
        accountType: leverage > 1 ? "margin" : "spot",
      };

      const { data: orderResponse, error } = await supabase.functions.invoke(
        "proxy-orders",
        {
          body: JSON.stringify(orderDetails),
        }
      );

      if (error) throw error;

      toast({
        title: "Order placed successfully!",
        description: `Bought ${amount} ${baseAsset} at ${currentPrice} ${quoteAsset}`,
      });

      // Update local storage balance
      const newBalance = availableBalance - (amount * currentPrice);
      localStorage.setItem(`balance_${quoteAsset}`, newBalance.toString());

    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error placing order",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Current Price</Label>
            <span className="text-sm font-medium">
              {currentPrice.toFixed(2)} {quoteAsset}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <Label>Available Balance</Label>
            <span className="text-sm font-medium">
              {availableBalance.toFixed(2)} {quoteAsset}
            </span>
          </div>

          <div className="space-y-2">
            <Label>Purchase Amount ({baseAsset})</Label>
            <Slider
              defaultValue={[0]}
              max={100}
              step={1}
              onValueChange={handleSliderChange}
            />
            <Input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              min={0}
              step="0.0001"
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Leverage (x{leverage})</Label>
            <Slider
              defaultValue={[1]}
              min={1}
              max={10}
              step={1}
              value={[leverage]}
              onValueChange={(values) => setLeverage(values[0])}
            />
          </div>

          <div className="space-y-2">
            <Label>Target Sell Price ({quoteAsset})</Label>
            <Input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(Number(e.target.value))}
              min={0}
              step="0.0001"
              className="mt-2"
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Loaned Amount:</span>
              <span>{loanedAmount.toFixed(4)} {baseAsset}</span>
            </div>
            <div className="flex justify-between">
              <span>Position Depth:</span>
              <span>{depth.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between">
              <span>Potential Profit:</span>
              <span className={potentialProfit >= 0 ? "text-green-500" : "text-red-500"}>
                {potentialProfit.toFixed(2)} {quoteAsset} ({profitPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={amount <= 0 || loading}
        >
          {loading ? "Placing Order..." : "Place Buy Order"}
        </Button>
      </form>
    </Card>
  );
}