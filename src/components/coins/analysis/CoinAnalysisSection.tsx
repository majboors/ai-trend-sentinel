import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { VideoCard } from "../VideoCard";
import { SentimentStats } from "../SentimentStats";
import type { SentimentData } from "../types";

type SentimentFilter = "all" | "buy" | "sell" | "others";

interface CoinAnalysisSectionProps {
  selectedCoin: string;
  setSelectedCoin: (coin: string) => void;
  availableCoins: string[];
  sentimentData: SentimentData | null;
  loading: boolean;
}

export function CoinAnalysisSection({
  selectedCoin,
  setSelectedCoin,
  availableCoins,
  sentimentData,
  loading,
}: CoinAnalysisSectionProps) {
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");

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

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <label htmlFor="coin-select" className="block text-sm font-medium mb-2">
          Select Coin for Detailed Analysis
        </label>
        <Select value={selectedCoin} onValueChange={setSelectedCoin}>
          <SelectTrigger className="w-full md:w-1/3">
            <SelectValue placeholder="Select a coin" />
          </SelectTrigger>
          <SelectContent>
            {availableCoins.map((coin) => (
              <SelectItem key={coin} value={coin}>
                {coin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6">
        <Label className="text-sm font-medium mb-2">Filter Comments</Label>
        <RadioGroup
          defaultValue="all"
          value={sentimentFilter}
          onValueChange={(value) => setSentimentFilter(value as SentimentFilter)}
          className="flex flex-wrap gap-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="buy" id="buy" />
            <Label htmlFor="buy" className="text-green-500">Buy</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sell" id="sell" />
            <Label htmlFor="sell" className="text-red-500">Sell</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="others" id="others" />
            <Label htmlFor="others" className="text-yellow-500">Others</Label>
          </div>
        </RadioGroup>
      </div>

      <SentimentStats loading={loading} stats={calculateSentiments()} />

      {/* Video Cards */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        {sentimentData && Object.entries(sentimentData.videos).map(([videoId, video]) => (
          <VideoCard 
            key={videoId} 
            videoId={videoId} 
            video={video} 
            sentimentFilter={sentimentFilter}
          />
        ))}
      </div>
    </div>
  );
}