import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MarketSentiment } from "@/components/dashboard/MarketSentiment";

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

          <div className="flex justify-end">
            <Button onClick={handleNext} className="gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}