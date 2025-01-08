import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { DashboardSection } from "./dashboard/DashboardSection";
import { CoinAnalysisSection } from "./analysis/CoinAnalysisSection";
import { useAllCoinsSentiment } from "@/hooks/useAllCoinsSentiment";
import type { SentimentData } from "./types";

export function CoinSentimentView() {
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [availableCoins, setAvailableCoins] = useState<string[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const { allCoinsData, loading: loadingAllCoins } = useAllCoinsSentiment();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setLoadingCoins(true);
        const response = await fetch('https://crypto.techrealm.pk/coin/search');
        if (!response.ok) {
          throw new Error('Failed to fetch coins');
        }
        const data = await response.json();
        setAvailableCoins(data.coins);
        if (data.coins.length > 0 && !selectedCoin) {
          setSelectedCoin(data.coins[0]);
        }
      } catch (error) {
        console.error('Error fetching coins:', error);
        toast({
          title: "Error",
          description: "Failed to fetch available coins. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoadingCoins(false);
      }
    };

    fetchCoins();
  }, [toast, selectedCoin]);

  useEffect(() => {
    const fetchSentimentData = async () => {
      if (!selectedCoin) return;
      
      try {
        setLoading(true);
        const response = await fetch(`https://crypto.techrealm.pk/coin/${selectedCoin}`);
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

  if (loadingCoins) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Dashboard - Always show with loading state if needed */}
      <DashboardSection allCoinsData={allCoinsData} loading={loadingAllCoins} />

      {/* Individual Coin Analysis - Show immediately after coins are loaded */}
      <CoinAnalysisSection
        selectedCoin={selectedCoin}
        setSelectedCoin={setSelectedCoin}
        availableCoins={availableCoins}
        sentimentData={sentimentData}
        loading={loading}
      />
    </div>
  );
}