import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Mock data - replace with real data later
const mockCoins = [
  {
    id: 1,
    name: "Bitcoin",
    symbol: "BTC",
    profit: true,
    data: [
      { time: "00:00", value: 40000 },
      { time: "04:00", value: 42000 },
      { time: "08:00", value: 41000 },
      { time: "12:00", value: 43000 },
    ],
  },
  {
    id: 2,
    name: "Ethereum",
    symbol: "ETH",
    profit: false,
    data: [
      { time: "00:00", value: 2800 },
      { time: "04:00", value: 2750 },
      { time: "08:00", value: 2600 },
      { time: "12:00", value: 2500 },
    ],
  },
];

export function CoinSplitView() {
  const [hoveredCoin, setHoveredCoin] = useState<number | null>(null);
  const profitCoins = mockCoins.filter((coin) => coin.profit);
  const lossCoins = mockCoins.filter((coin) => !coin.profit);

  const CoinCard = ({ coin }: { coin: typeof mockCoins[0] }) => (
    <Card
      className="p-4 h-[200px] cursor-pointer transition-all hover:shadow-lg"
      onMouseEnter={() => setHoveredCoin(coin.id)}
      onMouseLeave={() => setHoveredCoin(null)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{coin.name}</h3>
          <p className="text-sm text-muted-foreground">{coin.symbol}</p>
        </div>
      </div>

      {hoveredCoin === coin.id ? (
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
            <LineChart data={coin.data}>
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

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-green-500">Profit</h2>
        {profitCoins.map((coin) => (
          <CoinCard key={coin.id} coin={coin} />
        ))}
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-red-500">Loss</h2>
        {lossCoins.map((coin) => (
          <CoinCard key={coin.id} coin={coin} />
        ))}
      </div>
    </div>
  );
}