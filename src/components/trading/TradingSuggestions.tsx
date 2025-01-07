import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MarketSentiment } from "@/components/dashboard/MarketSentiment";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CoinVolatileView } from "@/components/coins/CoinVolatileView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  currentPrice: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  strategy: "buy" | "hold" | "sell";
}

const mockCoins: Coin[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    currentPrice: 43000,
    sentiment: {
      positive: 70,
      neutral: 20,
      negative: 10,
    },
    strategy: "buy",
  },
  // Add more mock coins as needed
];

export function TradingSuggestions() {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [boughtCoins, setBoughtCoins] = useState<Coin[]>([]);
  const [soldCoins, setSoldCoins] = useState<Coin[]>([]);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  const [margin, setMargin] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [viewType, setViewType] = useState<string>("suggestions");
  const { toast } = useToast();

  const progress = (currentIndex / mockCoins.length) * 100;
  const currentCoin = mockCoins[currentIndex];

  const handleStart = () => {
    setStarted(true);
    toast({
      title: "Analysis Started",
      description: "Analyzing coins for trading suggestions...",
    });
  };

  const handleNext = () => {
    if (currentIndex < mockCoins.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (currentCoin.strategy === "buy") {
        setBoughtCoins(prev => [...prev, currentCoin]);
      } else if (currentCoin.strategy === "sell") {
        setSoldCoins(prev => [...prev, currentCoin]);
      }
    } else {
      toast({
        title: "Analysis Complete",
        description: "You've reviewed all available coins.",
      });
    }
  };

  const handleBuy = () => {
    toast({
      title: "Purchase Successful",
      description: `Bought ${currentCoin.name} with ${margin}% margin and ${stopLoss}% stop loss`,
    });
    setIsBuyDialogOpen(false);
    handleNext();
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Button onClick={handleStart} size="lg" className="gap-2">
          <Play className="w-4 h-4" />
          Start Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="w-[200px]">
        <Select value={viewType} onValueChange={setViewType}>
          <SelectTrigger>
            <SelectValue placeholder="Select view type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="suggestions">Trading Suggestions</SelectItem>
            <SelectItem value="volatile">Volatility View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {viewType === "volatile" ? (
        <CoinVolatileView />
      ) : (
        <>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Analyzing coin {currentIndex + 1} of {mockCoins.length}
          </p>

          {currentCoin && (
            <Card className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{currentCoin.name}</h2>
                  <p className="text-muted-foreground">{currentCoin.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    ${currentCoin.currentPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="h-[300px]">
                <PerformanceChart />
              </div>

              <MarketSentiment />

              <div className="space-y-2">
                <h3 className="font-semibold">Suggested Strategy</h3>
                <p className={`text-lg font-bold ${
                  currentCoin.strategy === "buy" 
                    ? "text-green-500" 
                    : currentCoin.strategy === "sell" 
                      ? "text-red-500" 
                      : "text-yellow-500"
                }`}>
                  {currentCoin.strategy.toUpperCase()}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                {currentCoin.strategy === "buy" && (
                  <Button onClick={() => setIsBuyDialogOpen(true)} variant="default">
                    Buy
                  </Button>
                )}
                <Button onClick={handleNext} variant="outline" className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}

          <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buy {currentCoin?.name}</DialogTitle>
                <DialogDescription>
                  Set your margin and stop loss parameters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="margin">Margin (%)</Label>
                  <Input
                    id="margin"
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                    placeholder="Enter margin percentage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="Enter stop loss percentage"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBuyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBuy}>
                  Confirm Purchase
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}