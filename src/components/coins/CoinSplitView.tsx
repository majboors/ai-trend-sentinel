import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
}

interface CoinSplitViewProps {
  filter?: string | null;
}

export function CoinSplitView({ filter }: CoinSplitViewProps) {
  const [hoveredCoin, setHoveredCoin] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: coins = [], isLoading } = useQuery({
    queryKey: ['coins'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/functions/v1/fetch-binance-pairs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch coins');
      }

      return response.json();
    },
    refetchInterval: 30000,
  });

  const filteredCoins = coins.filter((coin: CoinData) => {
    if (!filter) return true;
    return filter === "profit" ? coin.profit : !coin.profit;
  });

  const profitCoins = filteredCoins.filter((coin: CoinData) => coin.profit);
  const lossCoins = filteredCoins.filter((coin: CoinData) => !coin.profit);

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
            ${coin.lastPrice.toFixed(8)}
          </p>
        </div>
        <div className={`text-sm ${coin.profit ? 'text-green-500' : 'text-red-500'}`}>
          {coin.priceChangePercent.toFixed(2)}%
        </div>
      </div>

      {hoveredCoin === coin.symbol ? (
        <div
          className={`h-[140px] rounded-lg flex items-center justify-center text-white font-bold text-xl ${
            coin.profit ? "bg-green-500/20" : "bg-red-500/20"
          }`}
        >
          <span className={coin.profit ? "text-green-500" : "text-red-500"}>
            {coin.profit ? "PROFIT" : "LOSS"}
          </span>
        </div>
      ) : (
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { time: "24h", value: coin.lastPrice - (coin.lastPrice * coin.priceChangePercent / 100) },
              { time: "now", value: coin.lastPrice },
            ]}>
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={coin.profit ? "#22c55e" : "#ef4444"}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 h-[200px]">
            <Skeleton className="h-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (filteredCoins.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No coins found matching the selected filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-green-500">Profit ({profitCoins.length})</h2>
        {profitCoins.map((coin: CoinData) => (
          <CoinCard key={coin.symbol} coin={coin} />
        ))}
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-red-500">Loss ({lossCoins.length})</h2>
        {lossCoins.map((coin: CoinData) => (
          <CoinCard key={coin.symbol} coin={coin} />
        ))}
      </div>
    </div>
  );
}