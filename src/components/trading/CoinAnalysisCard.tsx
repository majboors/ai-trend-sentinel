import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { MarketSentiment } from "@/components/dashboard/MarketSentiment";
import { CoinChart } from "./CoinChart";
import type { CoinData } from "./types";

interface CoinAnalysisCardProps {
  coin: CoinData;
  onNext: () => void;
  onBuy: () => void;
}

export function CoinAnalysisCard({ coin, onNext, onBuy }: CoinAnalysisCardProps) {
  // Function to determine strategy based on sentiment
  const determineStrategy = (sentimentData: any) => {
    if (!sentimentData || !Array.isArray(sentimentData)) {
      return coin.strategy;
    }

    const neutral = sentimentData.find(s => s.type === "Neutral")?.value || 0;
    const positive = sentimentData.find(s => s.type === "Positive")?.value || 0;
    const negative = sentimentData.find(s => s.type === "Negative")?.value || 0;

    if (neutral > 50) {
      return "COIN IS DEAD" as const;
    }
    if (positive > 20) {
      return "buy" as const;
    }
    if (negative > 10) {
      return "do not buy" as const;
    }

    return coin.strategy;
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
        <p className={`text-lg font-bold ${
          coin.strategy === "buy" 
            ? "text-green-500" 
            : coin.strategy === "do not buy" || coin.strategy === "sell"
              ? "text-red-500" 
              : coin.strategy === "COIN IS DEAD"
                ? "text-yellow-500"
                : "text-yellow-500"
        }`}>
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