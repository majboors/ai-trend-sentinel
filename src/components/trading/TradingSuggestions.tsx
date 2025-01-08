import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TradeNameDialog } from "./TradeNameDialog";
import { CoinAnalysisCard } from "./CoinAnalysisCard";
import { CoinVolatileView } from "@/components/coins/CoinVolatileView";
import { useCoinData } from "./hooks/useCoinData";
import type { TradeViewState } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TradingSuggestions() {
  const [started, setStarted] = useState(false);
  const [isTradeNameDialogOpen, setIsTradeNameDialogOpen] = useState(false);
  const [viewType, setViewType] = useState<string>("suggestions");
  const { toast } = useToast();
  
  const [tradeView, setTradeView] = useState<TradeViewState>({
    id: null,
    currentIndex: 0,
    coins: [],
  });

  const { data: coins = [], isLoading, error } = useCoinData();

  const progress = (tradeView.currentIndex / (coins.length || 1)) * 100;
  const currentCoin = coins[tradeView.currentIndex];

  const handleStart = () => {
    setIsTradeNameDialogOpen(true);
  };

  const handleCreateTradeView = async (name: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Please sign in to start analysis",
          variant: "destructive",
        });
        return;
      }

      const { data: tradeView, error } = await supabase
        .from('trade_views')
        .insert([
          { name, user_id: session.user.id }
        ])
        .select()
        .single();

      if (error) throw error;

      setTradeView({
        id: tradeView.id,
        currentIndex: 0,
        coins: coins,
      });
      
      setStarted(true);
      setIsTradeNameDialogOpen(false);
      
      toast({
        title: "Analysis Started",
        description: "Analyzing coins for trading suggestions...",
      });
    } catch (error) {
      console.error('Error creating trade view:', error);
      toast({
        title: "Error",
        description: "Failed to start analysis",
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    if (!tradeView.id || !currentCoin) return;

    try {
      await supabase
        .from('coin_indicators')
        .insert([
          {
            trade_view_id: tradeView.id,
            coin_symbol: currentCoin.symbol,
            sentiment: currentCoin.strategy,
            indicators: currentCoin.indicators,
          }
        ]);

      if (tradeView.currentIndex < coins.length - 1) {
        setTradeView(prev => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
        }));
      } else {
        toast({
          title: "Analysis Complete",
          description: "You've reviewed all available coins.",
        });
      }
    } catch (error) {
      console.error('Error saving coin analysis:', error);
      toast({
        title: "Error",
        description: "Failed to save analysis",
        variant: "destructive",
      });
    }
  };

  const handleBuy = async () => {
    if (!tradeView.id || !currentCoin) return;

    try {
      await supabase
        .from('coin_indicators')
        .insert([
          {
            trade_view_id: tradeView.id,
            coin_symbol: currentCoin.symbol,
            sentiment: currentCoin.strategy,
            indicators: currentCoin.indicators,
            user_response: 'buy'
          }
        ]);

      toast({
        title: "Trade Recorded",
        description: `Recorded buy decision for ${currentCoin.symbol}`,
      });
      
      handleNext();
    } catch (error) {
      console.error('Error recording trade:', error);
      toast({
        title: "Error",
        description: "Failed to record trade",
        variant: "destructive",
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
        <TradeNameDialog
          open={isTradeNameDialogOpen}
          onOpenChange={setIsTradeNameDialogOpen}
          onSubmit={handleCreateTradeView}
        />
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading coins...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
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
            Analyzing coin {tradeView.currentIndex + 1} of {coins.length}
          </p>

          {currentCoin && (
            <CoinAnalysisCard
              coin={currentCoin}
              onNext={handleNext}
              onBuy={handleBuy}
            />
          )}
        </>
      )}
    </div>
  );
}