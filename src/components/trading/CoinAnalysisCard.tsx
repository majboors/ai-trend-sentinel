import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinChart } from "./CoinChart";
import { NotificationSliders } from "./notifications/NotificationSliders";
import type { CoinData } from "./types";

interface CoinAnalysisCardProps {
  coin: CoinData;
  onNext: () => void;
  onBuy: () => void;
  currentIndex: number;
  total: number;
}

export function CoinAnalysisCard({
  coin,
  onNext,
  onBuy,
  currentIndex,
  total,
}: CoinAnalysisCardProps) {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{coin.symbol}</h3>
          <p className="text-muted-foreground">
            Current Price: ${coin.lastPrice.toFixed(2)}
          </p>
        </div>
        <NotificationSliders 
          symbol={coin.symbol} 
          currentPrice={coin.lastPrice} 
        />
      </div>

      <div className="h-[400px]">
        <CoinChart coin={coin} />
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} of {total} coins
        </p>
        <div className="space-x-2">
          <Button onClick={onBuy} variant="default">
            Buy
          </Button>
          <Button onClick={onNext} variant="outline">
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}