import { SentimentOverviewCard } from "./SentimentOverviewCard";
import { TopCoinsCard } from "./TopCoinsCard";
import { SentimentTrendCard } from "./SentimentTrendCard";
import type { SentimentData } from "../types";

interface DashboardSectionProps {
  allCoinsData: { [key: string]: SentimentData } | null;
  loading: boolean;
}

export function DashboardSection({ allCoinsData, loading }: DashboardSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
      <SentimentOverviewCard
        data={allCoinsData}
        title="Overall Market Sentiment"
        className="col-span-full md:col-span-2"
      />
      <TopCoinsCard
        data={allCoinsData}
        title="Top Bullish Coins"
        type="buy"
        className="col-span-full md:col-span-2"
      />
      <TopCoinsCard
        data={allCoinsData}
        title="Top Bearish Coins"
        type="sell"
        className="col-span-full md:col-span-2"
      />
      <SentimentTrendCard
        data={allCoinsData}
        title="Market Sentiment Trends"
        className="col-span-full md:col-span-3"
      />
    </div>
  );
}