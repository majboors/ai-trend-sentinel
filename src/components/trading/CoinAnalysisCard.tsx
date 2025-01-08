import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Play } from "lucide-react";
import { CoinChart } from "./CoinChart";
import type { Coin } from "./types";

interface CoinAnalysisCardProps {
  coin: Coin;
  onNext: () => void;
  onBuy: () => void;
  onLiveAnalyze?: () => void;
}

export function CoinAnalysisCard({ 
  coin, 
  onNext, 
  onBuy,
  onLiveAnalyze 
}: CoinAnalysisCardProps) {
  const determineStrategy = (sentiment: any) => {
    const { neutral, positive, negative } = sentiment;
    console.log("Sentiment values:", { neutral, positive, negative });

    // Highest priority: Check neutral sentiment
    // If neutral > 50%, coin is dead regardless of other values
    if (neutral > 50) {
      return "COIN IS DEAD";
    }

    // Second priority: Check positive sentiment
    if (positive > 20) {
      return "buy";
    }

    // Third priority: Check negative sentiment
    if (negative > 10) {
      return "do not buy";
    }

    // Default case
    return "hold";
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold">{coin.symbol}</h3>
          <p className="text-muted-foreground">Current Price: ${coin.price}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onLiveAnalyze} variant="outline" className="gap-2">
            <Play className="w-4 h-4" />
            Live Analyze
          </Button>
          <Button onClick={onNext} variant="outline" className="gap-2">
            Skip
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button onClick={onBuy} className="gap-2">
            Buy Now
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <CoinChart data={coin.chartData} />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Strategy</h4>
            <p className="text-lg">{determineStrategy(coin.sentiment)}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">24h Change</h4>
            <p className={coin.priceChange >= 0 ? "profit text-lg" : "loss text-lg"}>
              {coin.priceChange}%
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Analysis</h4>
          <p className="text-muted-foreground">{coin.analysis}</p>
        </div>
      </div>
    </Card>
  );
}