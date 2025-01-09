import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TradeNameDialog } from "./TradeNameDialog";
import { CoinAnalysisCard } from "./CoinAnalysisCard";
import { CoinVolatileView } from "@/components/coins/CoinVolatileView";
import { StartAnalysisButton } from "./StartAnalysisButton";
import { AnalysisHeader } from "./analysis/AnalysisHeader";
import { LiveAnalysisSidebar } from "./analysis/LiveAnalysisSidebar";
import { useCoinData } from "./hooks/useCoinData";
import { Button } from "@/components/ui/button";
import { LineChart } from "lucide-react";
import type { TradeViewState } from "./types";

export function TradingSuggestions() {
  const [started, setStarted] = useState(false);
  const [isTradeNameDialogOpen, setIsTradeNameDialogOpen] = useState(false);
  const [viewType, setViewType] = useState<string>("suggestions");
  const [isLiveAnalysisOpen, setIsLiveAnalysisOpen] = useState(false);
  const { toast } = useToast();
  
  const [tradeView, setTradeView] = useState<TradeViewState>({
    id: null,
    currentIndex: 0,
    coins: [],
  });

  const { data: coins = [], isLoading, error } = useCoinData();
  const currentCoin = coins[tradeView.currentIndex];

  const handleStart = () => {
    setIsTradeNameDialogOpen(true);
  };

  const toggleLiveAnalysis = () => {
    setIsLiveAnalysisOpen(!isLiveAnalysisOpen);
  };

  const handleCreateTradeView = async (name: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!sessionData.session) {
        toast({
          title: "Error",
          description: "Please sign in to start analysis",
          variant: "destructive",
        });
        return;
      }

      const { data: existingView, error: checkError } = await supabase
        .from('trade_views')
        .select()
        .eq('user_id', sessionData.session.user.id)
        .eq('name', name)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingView) {
        toast({
          title: "Error",
          description: "A trading view with this name already exists. Please choose a different name.",
          variant: "destructive",
        });
        return;
      }

      const { data, error: insertError } = await supabase
        .from('trade_views')
        .insert([{ 
          name, 
          user_id: sessionData.session.user.id,
          status: 'active'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setTradeView({
        id: data.id,
        currentIndex: 0,
        coins: coins,
      });
      
      setStarted(true);
      setIsTradeNameDialogOpen(false);
      
      toast({
        title: "Analysis Started",
        description: "Analyzing coins for trading suggestions...",
      });
    } catch (error: any) {
      console.error('Error creating trade view:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    if (!tradeView.id || !currentCoin) return;

    try {
      await supabase
        .from('coin_indicators')
        .insert([{
          trade_view_id: tradeView.id,
          coin_symbol: currentCoin.symbol,
          sentiment: currentCoin.strategy,
          indicators: currentCoin.indicators,
        }]);

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
    } catch (error: any) {
      console.error('Error saving coin analysis:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save analysis",
        variant: "destructive",
      });
    }
  };

  const handleBuy = async () => {
    if (!tradeView.id || !currentCoin) return;

    try {
      await supabase
        .from('coin_indicators')
        .insert([{
          trade_view_id: tradeView.id,
          coin_symbol: currentCoin.symbol,
          sentiment: currentCoin.strategy,
          indicators: currentCoin.indicators,
          user_response: 'buy'
        }]);

      toast({
        title: "Trade Recorded",
        description: `Recorded buy decision for ${currentCoin.symbol}`,
      });
      
      handleNext();
    } catch (error: any) {
      console.error('Error recording trade:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record trade",
        variant: "destructive",
      });
    }
  };

  if (!started) {
    return (
      <div className="glass-card p-8">
        <StartAnalysisButton onClick={handleStart} />
        <TradeNameDialog
          open={isTradeNameDialogOpen}
          onOpenChange={setIsTradeNameDialogOpen}
          onSubmit={handleCreateTradeView}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-lg text-muted-foreground">Loading coins...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-lg text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 space-y-6">
      <div className="flex items-center justify-between">
        <AnalysisHeader
          viewType={viewType}
          onViewTypeChange={setViewType}
          currentIndex={tradeView.currentIndex}
          total={coins.length}
        />
      </div>

      {viewType === "volatile" ? (
        <CoinVolatileView />
      ) : (
        currentCoin && (
          <CoinAnalysisCard
            coin={currentCoin}
            onNext={handleNext}
            onBuy={handleBuy}
            currentIndex={tradeView.currentIndex}
            total={coins.length}
            tradeViewId={tradeView.id}
          />
        )
      )}

      <LiveAnalysisSidebar 
        isOpen={isLiveAnalysisOpen} 
        onClose={() => setIsLiveAnalysisOpen(false)}
        currentCoin={currentCoin?.symbol}
      />
    </div>
  );
}