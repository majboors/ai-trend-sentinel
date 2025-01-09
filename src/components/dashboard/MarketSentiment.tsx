import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface SentimentData {
  type: string;
  value: number;
  color: string;
}

interface MarketSentimentProps {
  onSentimentChange?: (sentimentData: SentimentData[]) => void;
  selectedCoin?: string;
}

const defaultSentimentData: SentimentData[] = [
  { type: "Positive", value: 70, color: "bg-green-500" },
  { type: "Neutral", value: 20, color: "bg-yellow-500" },
  { type: "Negative", value: 10, color: "bg-red-500" },
];

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

  // Calculate sentiment percentages from video data
  const calculateSentimentPercentages = (videos: any) => {
    let buyCount = 0;
    let sellCount = 0;
    let othersCount = 0;
    let totalCount = 0;

    // Count sentiments from comments
    Object.values(videos).forEach((video: any) => {
      if (video.comments && Array.isArray(video.comments)) {
        video.comments.forEach((comment: any) => {
          if (comment.indicator === 'buy') buyCount++;
          else if (comment.indicator === 'sell') sellCount++;
          else if (comment.indicator === 'others') othersCount++;
          totalCount++;
        });
      }

      // Add title sentiment if available
      if (video.title_label === 'buy') {
        buyCount++;
        totalCount++;
      } else if (video.title_label === 'sell') {
        sellCount++;
        totalCount++;
      } else if (video.title_label === 'others') {
        othersCount++;
        totalCount++;
      }
    });

    // Calculate percentages
    const total = totalCount || 1; // Prevent division by zero
    return [
      { type: "Positive", value: Math.round((buyCount / total) * 100), color: "bg-green-500" },
      { type: "Neutral", value: Math.round((othersCount / total) * 100), color: "bg-yellow-500" },
      { type: "Negative", value: Math.round((sellCount / total) * 100), color: "bg-red-500" },
    ];
  };

  const determineStrategy = (sentimentData: SentimentData[]) => {
    const neutral = sentimentData.find(s => s.type === "Neutral")?.value || 0;
    const positive = sentimentData.find(s => s.type === "Positive")?.value || 0;
    const negative = sentimentData.find(s => s.type === "Negative")?.value || 0;

    // First priority: Check neutral sentiment
    if (neutral > 50) {
      return "COIN IS DEAD";
    }
    
    // Second priority: Check negative sentiment
    if (negative > 10) {
      return "do not buy";
    }
    
    // Third priority: Check positive sentiment
    if (positive > 20) {
      return "buy";
    }

    // If none of the conditions are met
    return "hold";
  };

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
        setDataFetched(true);
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