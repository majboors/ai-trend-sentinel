import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LineChart, TrendingUp, TrendingDown } from "lucide-react";
import { MarketSentiment } from "@/components/dashboard/MarketSentiment";
import { CoinChart } from "./CoinChart";
import type { CoinData, Strategy } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { AnalysisProgress } from "./AnalysisProgress";

interface CoinAnalysisCardProps {
  coin: CoinData;
  onNext: () => void;
  onBuy: () => void;
  currentIndex: number;
  total: number;
}

export function CoinAnalysisCard({ coin, onNext, onBuy, currentIndex, total }: CoinAnalysisCardProps) {
  const { toast } = useToast();
  const [isStrategyLoading, setIsStrategyLoading] = useState(true);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy>(coin.strategy);
  const [isLiveAnalysisOpen, setIsLiveAnalysisOpen] = useState(false);

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
    <div className="space-y-6 animate-fade-in">
      {/* Top Section */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-white/10">
          <div className="space-y-6">
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

            <Card className="bg-card/30 p-4 border-white/5">
              <div className="space-y-4">
                <AnalysisProgress currentIndex={currentIndex} total={total} />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setIsLiveAnalysisOpen(!isLiveAnalysisOpen)}
                >
                  <LineChart className="h-4 w-4" />
                  Live Analysis
                </Button>
              </div>
            </Card>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CoinChart coin={coin} />
      </div>

      {/* Market Sentiment and Strategy Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/30 rounded-lg">
          <MarketSentiment 
            selectedCoin={`${coin.baseAsset}`}
            onSentimentChange={(sentimentData) => {
              setIsStrategyLoading(false);
              if (sentimentData[0]?.strategy) {
                setCurrentStrategy(sentimentData[0].strategy);
                coin.strategy = sentimentData[0].strategy;
              }
            }}
          />
        </Card>

        <Card className="p-6 bg-card/30 rounded-lg">
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Suggested Strategy</h3>
            {isStrategyLoading ? (
              <p className="text-lg font-bold text-muted-foreground animate-pulse">
                Loading strategy...
              </p>
            ) : (
              <p className={`text-lg font-bold ${getStrategyColor(currentStrategy)}`}>
                {currentStrategy.toUpperCase()}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4">
              {!isStrategyLoading && currentStrategy === "buy" && (
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
          </div>
        </Card>
      </div>
    </div>
  );
}