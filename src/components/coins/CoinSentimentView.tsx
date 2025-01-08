import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DashboardSection } from "./dashboard/DashboardSection";
import { CoinAnalysisSection } from "./analysis/CoinAnalysisSection";
import { useAllCoinsSentiment } from "@/hooks/useAllCoinsSentiment";
import type { SentimentData } from "./types";

const RETRY_DELAY = 5000; // 5 seconds delay before retry
const MAX_RETRIES = 2;

export function CoinSentimentView() {
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [availableCoins, setAvailableCoins] = useState<string[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const { allCoinsData, loading: loadingAllCoins } = useAllCoinsSentiment();
  const { toast } = useToast();

  // Fetch available coins first with retry logic
  useEffect(() => {
    let retryCount = 0;
    let isMounted = true;
    
    const fetchCoins = async () => {
      try {
        const response = await fetch('https://crypto.techrealm.pk/coin/search');
        if (!response.ok) {
          throw new Error('Failed to fetch coins');
        }
        const data = await response.json();
        if (isMounted) {
          setAvailableCoins(data.coins || []);
        }
      } catch (error) {
        console.error('Error fetching coins:', error);
        if (retryCount < MAX_RETRIES && isMounted) {
          retryCount++;
          setTimeout(fetchCoins, RETRY_DELAY);
        } else if (isMounted) {
          toast({
            title: "Warning",
            description: "Could not load available coins. Please try again later.",
            variant: "destructive",
          });
        }
      }
    };

    fetchCoins();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Fetch sentiment data separately with retry logic
  useEffect(() => {
    if (!selectedCoin) return;
    
    let retryCount = 0;
    let isMounted = true;
    
    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://crypto.techrealm.pk/coin/${selectedCoin}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data');
        }
        const data = await response.json();
        if (isMounted) {
          setSentimentData(data);
        }
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        if (retryCount < MAX_RETRIES && isMounted) {
          retryCount++;
          setTimeout(fetchSentimentData, RETRY_DELAY);
        } else if (isMounted) {
          toast({
            title: "Warning",
            description: "Could not load sentiment data. Please try again later.",
            variant: "destructive",
          });
          setSentimentData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSentimentData();
    return () => {
      isMounted = false;
    };
  }, [selectedCoin, toast]);

  return (
    <div className="space-y-6">
      {/* Dashboard Section - Show loading state */}
      <DashboardSection allCoinsData={allCoinsData} loading={loadingAllCoins} />

      {/* Coin Analysis Section - Show immediately */}
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