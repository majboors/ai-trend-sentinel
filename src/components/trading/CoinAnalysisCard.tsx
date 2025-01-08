import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { MarketSentiment } from "@/components/dashboard/MarketSentiment";
import { CoinChart } from "./CoinChart";
import type { CoinData } from "./types";

interface CoinAnalysisCardProps {
  coin: CoinData;
  onNext: () => void;
  onBuy: () => void;
}

export function CoinAnalysisCard({ coin, onNext, onBuy }: CoinAnalysisCardProps) {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{coin.baseAsset}/{coin.quoteAsset}</h2>
          <p className="text-muted-foreground">{coin.symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            ${parseFloat(coin.lastPrice.toString()).toLocaleString()}
          </p>
          <p className={`text-sm ${coin.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {coin.priceChangePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <CoinChart coin={coin} />

      <MarketSentiment />

      <div className="space-y-2">
        <h3 className="font-semibold">Suggested Strategy</h3>
        <p className={`text-lg font-bold ${
          coin.strategy === "buy" 
            ? "text-green-500" 
            : coin.strategy === "sell" 
              ? "text-red-500" 
              : "text-yellow-500"
        }`}>
          {coin.strategy.toUpperCase()}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        {coin.strategy === "buy" && (
          <Button onClick={onBuy} variant="default">
            Buy
          </Button>
        )}
        <Button onClick={onNext} variant="outline" className="gap-2">
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}