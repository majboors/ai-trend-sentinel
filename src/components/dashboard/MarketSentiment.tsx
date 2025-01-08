import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SentimentData {
  type: string;
  value: number;
  color: string;
}

const defaultSentimentData: SentimentData[] = [
  { type: "Positive", value: 70, color: "bg-green-500" },
  { type: "Neutral", value: 20, color: "bg-yellow-500" },
  { type: "Negative", value: 10, color: "bg-red-500" },
];

export function MarketSentiment() {
  const [selectedCoin, setSelectedCoin] = useState<string>("market");
  const [availableCoins, setAvailableCoins] = useState<string[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>(defaultSentimentData);
  const [loading, setLoading] = useState(false);
  const [coinsLoading, setCoinsLoading] = useState(true);

  // Fetch available coins
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await fetch('https://crypto.techrealm.pk/coin/search');
        if (!response.ok) {
          throw new Error('Failed to fetch coins');
        }
        const data = await response.json();
        if (data.coins && Array.isArray(data.coins)) {
          // Filter out any invalid coin symbols
          const validCoins = data.coins.filter(coin => 
            typeof coin === 'string' && coin.length > 0 && !coin.includes(' ')
          );
          setAvailableCoins(validCoins);
        }
      } catch (error) {
        console.error('Error fetching coins:', error);
      } finally {
        setCoinsLoading(false);
      }
    };

    fetchCoins();
  }, []);

  // Fetch sentiment data when coin is selected
  useEffect(() => {
    const fetchSentimentData = async () => {
      if (!selectedCoin || selectedCoin === "market") return;
      
      try {
        setLoading(true);
        const response = await fetch(`https://crypto.techrealm.pk/coin/${selectedCoin}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data');
        }
        const data = await response.json();
        
        // Transform API data to match our format
        const newSentimentData: SentimentData[] = [
          { type: "Positive", value: data.positive || 0, color: "bg-green-500" },
          { type: "Neutral", value: data.neutral || 0, color: "bg-yellow-500" },
          { type: "Negative", value: data.negative || 0, color: "bg-red-500" },
        ];
        
        setSentimentData(newSentimentData);
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        // Reset to default data on error
        setSentimentData(defaultSentimentData);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCoin === "market") {
      setSentimentData(defaultSentimentData);
      setLoading(false);
    } else if (selectedCoin) {
      fetchSentimentData();
    }
  }, [selectedCoin]);

  return (
    <Card className="glass-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Market Sentiment</h3>
        <Select value={selectedCoin} onValueChange={setSelectedCoin} disabled={coinsLoading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={coinsLoading ? "Loading coins..." : "Select coin"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="market">Overall Market</SelectItem>
            {availableCoins.map((coin) => (
              <SelectItem key={coin} value={coin}>
                {coin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        {sentimentData.map((sentiment) => (
          <div key={sentiment.type} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{sentiment.type}</span>
              <span>{sentiment.value}%</span>
            </div>
            <Progress 
              value={sentiment.value} 
              className={`${sentiment.color} ${loading && selectedCoin !== "market" ? 'opacity-50' : ''}`} 
            />
          </div>
        ))}
      </div>
    </Card>
  );
}