import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Folder, FolderOpen } from "lucide-react";

// Mock data - replace with real data later
const mockCoins = [
  { id: 1, name: "Bitcoin", symbol: "BTC", profit: true },
  { id: 2, name: "Ethereum", symbol: "ETH", profit: false },
  { id: 3, name: "Cardano", symbol: "ADA", profit: true },
];

interface CoinFolderViewProps {
  filter?: string | null;
}

export function CoinFolderView({ filter }: CoinFolderViewProps) {
  const [openFolder, setOpenFolder] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleCoinClick = (coinId: number) => {
    navigate(`/coins/${coinId}`);
  };

  const filteredCoins = mockCoins.filter((coin) => {
    if (!filter) return true;
    return filter === "profit" ? coin.profit : !coin.profit;
  });

  if (filteredCoins.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No coins found matching the selected filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredCoins.map((coin) => (
        <Card
          key={coin.id}
          className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
            openFolder === coin.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => handleCoinClick(coin.id)}
          onMouseEnter={() => setOpenFolder(coin.id)}
          onMouseLeave={() => setOpenFolder(null)}
        >
          <div className="flex items-center gap-3">
            {openFolder === coin.id ? (
              <FolderOpen className="h-6 w-6 text-primary" />
            ) : (
              <Folder className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-semibold">{coin.name}</h3>
              <p className="text-sm text-muted-foreground">{coin.symbol}</p>
            </div>
          </div>
          
          {openFolder === coin.id && (
            <div className="mt-4 pt-4 border-t animate-fade-in">
              <p className={`text-sm ${coin.profit ? "text-green-500" : "text-red-500"}`}>
                {coin.profit ? "In Profit" : "In Loss"}
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}