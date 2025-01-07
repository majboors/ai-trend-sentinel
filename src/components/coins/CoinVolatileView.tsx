import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CoinCard } from "./CoinCard";
import { createVolatileTrade, subscribeToVolatileTrades } from "@/services/volatileTradeService";

interface CoinData {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  priceChange: number;
  priceChangePercent: number;
  lastPrice: number;
  volume: number;
  quoteVolume: number;
  profit: boolean;
  volatility: number;
  highPrice: number;
  lowPrice: number;
}

export function CoinVolatileView() {
  const [hoveredCoin, setHoveredCoin] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: coins = [], isLoading, error, refetch } = useQuery({
    queryKey: ['volatile-coins'],
    queryFn: async () => {
      console.log('Starting to fetch volatile coins...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        throw new Error('No session');
      }

      const response = await supabase.functions.invoke('fetch-binance-pairs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Error fetching trading pairs:', response.error);
        throw new Error(response.error.message || 'Failed to fetch coins');
      }

      return response.data || [];
    },
    refetchInterval: 30000,
    meta: {
      onError: (error: Error) => {
        console.error('Query error:', error);
        toast({
          title: "Error",
          description: `Error fetching coins: ${error.message}`,
          variant: "destructive",
        });
      },
    },
  });

  useEffect(() => {
    const channel = subscribeToVolatileTrades((payload) => {
      console.log('Volatile trade change:', payload);
      void refetch();
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleTradeClick = async (coin: CoinData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Please sign in to trade",
          variant: "destructive",
        });
        return;
      }

      const trade = await createVolatileTrade({
        user_id: session.user.id,
        symbol: coin.symbol,
        entry_price: coin.lastPrice,
        amount: 0,
        volatility: coin.volatility,
        high_price: coin.highPrice,
        low_price: coin.lowPrice,
      });

      toast({
        title: "Success",
        description: "Trade created successfully",
      });
      
      navigate(`/trading/volatile/${trade.id}`);
    } catch (error) {
      console.error('Error handling trade:', error);
      toast({
        title: "Error",
        description: "Failed to process trade",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error loading coins: {error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(11)].map((_, i) => (
          <Card key={i} className="p-4 h-[200px]">
            <Skeleton className="h-full" />
          </Card>
        ))}
      </div>
    );
  }

  const topVolatileCoins = coins.slice(0, 10);
  const otherCoins = coins.slice(10);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-purple-500">Top 10 Most Volatile Coins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topVolatileCoins.map((coin: CoinData) => (
            <CoinCard
              key={coin.symbol}
              coin={coin}
              isHovered={hoveredCoin === coin.symbol}
              onHover={setHoveredCoin}
              onClick={handleTradeClick}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">All Other Coins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherCoins.map((coin: CoinData) => (
            <CoinCard
              key={coin.symbol}
              coin={coin}
              isHovered={hoveredCoin === coin.symbol}
              onHover={setHoveredCoin}
              onClick={handleTradeClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}