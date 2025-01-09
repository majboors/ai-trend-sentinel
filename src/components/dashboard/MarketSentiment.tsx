import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { defaultSentimentData, calculateSentimentPercentages, determineStrategy } from "./utils/sentimentCalculations";
import type { MarketSentimentProps, SentimentData } from "./types/sentiment";

export function MarketSentiment({ onSentimentChange, selectedCoin }: MarketSentimentProps) {
  const [currentCoin, setCurrentCoin] = useState<string>("market");
  const [availableCoins, setAvailableCoins] = useState<string[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>(defaultSentimentData);
  const [loading, setLoading] = useState(false);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const { toast } = useToast();

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
          const validCoins = data.coins.filter(coin => 
            typeof coin === 'string' && coin.length > 0 && !coin.includes(' ')
          );
          setAvailableCoins(validCoins);
          
          // If we have a selectedCoin, try to find it in the available coins
          if (selectedCoin && validCoins.includes(selectedCoin)) {
            setCurrentCoin(selectedCoin);
          }
        }
      } catch (error) {
        console.error('Error fetching coins:', error);
        toast({
          title: "Error",
          description: "Failed to fetch available coins",
          variant: "destructive",
        });
      } finally {
        setCoinsLoading(false);
      }
    };

    fetchCoins();
  }, [selectedCoin, toast]);

  // Update parent component when sentiment data changes and data is fetched
  useEffect(() => {
    if (onSentimentChange && dataFetched) {
      const strategy = determineStrategy(sentimentData);
      onSentimentChange(sentimentData.map(data => ({
        ...data,
        strategy
      })));
    }
  }, [sentimentData, onSentimentChange, dataFetched]);

  // Fetch sentiment data when coin is selected
  useEffect(() => {
    const fetchSentimentData = async () => {
      if (!currentCoin || currentCoin === "market") {
        setSentimentData(defaultSentimentData);
        setDataFetched(true);
        return;
      }
      
      try {
        setLoading(true);
        setDataFetched(false);
        const response = await fetch(`https://crypto.techrealm.pk/coin/${currentCoin}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data');
        }
        const data = await response.json();
        
        if (data.videos) {
          const newSentimentData = calculateSentimentPercentages(data.videos);
          setSentimentData(newSentimentData);
        } else {
          setSentimentData(defaultSentimentData);
        }
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch sentiment data",
          variant: "destructive",
        });
        setSentimentData(defaultSentimentData);
      } finally {
        setLoading(false);
        // Only set dataFetched to true after a small delay to ensure graph rendering
        setTimeout(() => {
          setDataFetched(true);
        }, 500);
      }
    };

    fetchSentimentData();
  }, [currentCoin, toast]);

  return (
    <Card className="glass-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Market Sentiment</h3>
        <Select 
          value={currentCoin} 
          onValueChange={setCurrentCoin} 
          disabled={coinsLoading}
        >
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
              className={`${sentiment.color} ${loading && currentCoin !== "market" ? 'opacity-50' : ''}`} 
            />
          </div>
        ))}
      </div>
    </Card>
  );
}