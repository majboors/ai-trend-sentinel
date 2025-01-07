import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

interface CoinCardProps {
  coin: CoinData;
  isHovered: boolean;
  onHover: (symbol: string | null) => void;
  onClick: (coin: CoinData) => void;
}

export function CoinCard({ coin, isHovered, onHover, onClick }: CoinCardProps) {
  return (
    <Card
      className="p-4 h-[200px] cursor-pointer transition-all hover:shadow-lg"
      onMouseEnter={() => onHover(coin.symbol)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(coin)}
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

      {isHovered ? (
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
}