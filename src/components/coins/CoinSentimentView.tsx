import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface SentimentData {
  videos: {
    [key: string]: {
      comments: {
        author: string;
        comment_response: string;
        indicator: string;
        text: string;
      }[];
    };
  };
}

export function CoinSentimentView() {
  const [selectedCoin, setSelectedCoin] = useState<string>("1000CAT");
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://45.90.122.221:5000/coin/${selectedCoin}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data');
        }
        const data = await response.json();
        setSentimentData(data);
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch sentiment data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentData();
  }, [selectedCoin, toast]);

  const calculateSentiments = () => {
    if (!sentimentData?.videos) return { buy: 0, sell: 0, others: 0, total: 0 };

    let buy = 0, sell = 0, others = 0;

    Object.values(sentimentData.videos).forEach(video => {
      video.comments.forEach(comment => {
        if (comment.indicator === 'buy') buy++;
        else if (comment.indicator === 'sell') sell++;
        else others++;
      });
    });

    const total = buy + sell + others;
    return { buy, sell, others, total };
  };

  const { buy, sell, others, total } = calculateSentiments();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Market Sentiment Analysis</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Positive (Buy)</span>
              <span>{total > 0 ? ((buy / total) * 100).toFixed(1) : 0}%</span>
            </div>
            <Progress value={total > 0 ? (buy / total) * 100 : 0} className="bg-green-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Negative (Sell)</span>
              <span>{total > 0 ? ((sell / total) * 100).toFixed(1) : 0}%</span>
            </div>
            <Progress value={total > 0 ? (sell / total) * 100 : 0} className="bg-red-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Neutral</span>
              <span>{total > 0 ? ((others / total) * 100).toFixed(1) : 0}%</span>
            </div>
            <Progress value={total > 0 ? (others / total) * 100 : 0} className="bg-yellow-500" />
          </div>
        </div>
      </Card>

      {sentimentData && Object.entries(sentimentData.videos).map(([videoId, video]) => (
        <Card key={videoId} className="p-6">
          <h3 className="text-lg font-semibold mb-4">Video Comments Analysis</h3>
          <div className="space-y-4">
            {video.comments.map((comment, index) => (
              <div key={index} className="border-l-4 border-primary p-4 bg-muted/50 rounded">
                <p className="text-sm text-muted-foreground mb-2">Author: {comment.author}</p>
                <p className="mb-2">{comment.text}</p>
                <p className="text-sm">
                  Sentiment: <span className={`font-semibold ${
                    comment.indicator === 'buy' ? 'text-green-500' :
                    comment.indicator === 'sell' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}>
                    {comment.indicator.toUpperCase()}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}