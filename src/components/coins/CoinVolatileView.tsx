import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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

  const { data: coins = [], isLoading, error } = useQuery({
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
        toast.error(`Error fetching coins: ${error.message}`);
      },
    },
  });

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

  const CoinCard = ({ coin }: { coin: CoinData }) => (
    <Card
      className="p-4 h-[200px] cursor-pointer transition-all hover:shadow-lg"
      onMouseEnter={() => setHoveredCoin(coin.symbol)}
      onMouseLeave={() => setHoveredCoin(null)}
      onClick={() => navigate(`/coins/${coin.symbol}`)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{coin.baseAsset}/{coin.quoteAsset}</h3>
          <p className="text-sm text-muted-foreground">
            ${parseFloat(coin.lastPrice.toString()).toFixed(8)}
          </p>
        </div>
        <div className="text-sm">
          <span className="font-semibold">Volatility: </span>
          <span className="text-purple-500">{coin.volatility.toFixed(2)}%</span>
        </div>
      </div>

      {hoveredCoin === coin.symbol ? (
        <div className="h-[140px] rounded-lg flex items-center justify-center text-white font-bold text-xl bg-purple-500/20">
          <span className="text-purple-500">
            {coin.volatility.toFixed(2)}% Volatile
          </span>
        </div>
      ) : (
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { time: "Low", value: coin.lowPrice },
              { time: "Current", value: coin.lastPrice },
              { time: "High", value: coin.highPrice },
            ]}>
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#9333ea"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-purple-500">Top 10 Most Volatile Coins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topVolatileCoins.map((coin: CoinData) => (
            <CoinCard key={coin.symbol} coin={coin} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">All Other Coins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherCoins.map((coin: CoinData) => (
            <CoinCard key={coin.symbol} coin={coin} />
          ))}
        </div>
      </div>
    </div>
  );
}