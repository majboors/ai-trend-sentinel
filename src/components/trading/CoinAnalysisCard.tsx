import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { MarketSentiment } from "@/components/dashboard/MarketSentiment";
import { CoinChart } from "./CoinChart";
import type { CoinData, Strategy } from "./types";

interface CoinAnalysisCardProps {
  coin: CoinData;
  onNext: () => void;
  onBuy: () => void;
}

export function CoinAnalysisCard({ coin, onNext, onBuy }: CoinAnalysisCardProps) {
  const determineStrategy = (sentimentData: any): Strategy => {
    if (!sentimentData || !Array.isArray(sentimentData)) {
      return coin.strategy;
    }

    const neutral = sentimentData.find(s => s.type === "Neutral")?.value || 0;
    const positive = sentimentData.find(s => s.type === "Positive")?.value || 0;
    const negative = sentimentData.find(s => s.type === "Negative")?.value || 0;

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

    // Default strategy if no conditions are met
    return "hold";
  };

  const getStrategyColor = (strategy: Strategy): string => {
    switch (strategy) {
      case "buy":
        return "text-green-500";
      case "do not buy":
      case "sell":
        return "text-red-500";
      case "COIN IS DEAD":
        return "text-yellow-500";
      default:
        return "text-yellow-500";
    }
  };

  return (
    <Card className="p-6 space-y-8 bg-card/50 backdrop-blur-sm border-white/10">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {coin.baseAsset}/{coin.quoteAsset}
          </h2>
          <p className="text-muted-foreground">{coin.symbol}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xl font-semibold tracking-tight">
            ${parseFloat(coin.lastPrice.toString()).toLocaleString()}
          </p>
          <p className={`flex items-center justify-end gap-1 ${
            coin.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {coin.priceChangePercent >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {coin.priceChangePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <CoinChart coin={coin} />

      <div className="p-4 bg-card/30 rounded-lg">
        <MarketSentiment 
          onSentimentChange={(sentimentData) => {
            const newStrategy = determineStrategy(sentimentData);
            if (newStrategy !== coin.strategy) {
              coin.strategy = newStrategy;
            }
          }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Suggested Strategy</h3>
        <p className={`text-lg font-bold ${getStrategyColor(coin.strategy)}`}>
          {coin.strategy.toUpperCase()}
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {coin.strategy === "buy" && (
          <Button 
            onClick={onBuy} 
            variant="default"
            className="px-6"
          >
            Buy Now
          </Button>
        )}
        <Button 
          onClick={onNext} 
          variant="outline" 
          className="gap-2"
        >
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}