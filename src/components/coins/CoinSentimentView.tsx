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
        
        // Filter out any invalid coins and ensure we have an array
        const validCoins = Array.isArray(data.coins) ? data.coins.filter(Boolean) : [];
        
        if (isMounted) {
          setAvailableCoins(validCoins);
          // If no coin is selected and we have coins, select the first one
          if (!selectedCoin && validCoins.length > 0) {
            setSelectedCoin(validCoins[0]);
          }
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
  }, [toast, selectedCoin]);

  // Fetch sentiment data separately with retry logic
  useEffect(() => {
    if (!selectedCoin) return;
    
    let retryCount = 0;
    let isMounted = true;
    let controller = new AbortController();
    
    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://crypto.techrealm.pk/coin/${selectedCoin}`, {
          signal: controller.signal
        });
        
        if (!response.ok) {
          // If this coin fails, try the next one in the list
          const currentIndex = availableCoins.indexOf(selectedCoin);
          if (currentIndex < availableCoins.length - 1) {
            setSelectedCoin(availableCoins[currentIndex + 1]);
          }
          throw new Error(`Failed to fetch sentiment data for ${selectedCoin}`);
        }
        
        const data = await response.json();
        if (isMounted) {
          // Update sentiment data incrementally as we receive it
          setSentimentData(prevData => ({
            ...prevData,
            ...data
          }));
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        console.error('Error fetching sentiment data:', error);
        if (retryCount < MAX_RETRIES && isMounted) {
          retryCount++;
          setTimeout(fetchSentimentData, RETRY_DELAY);
        } else if (isMounted) {
          toast({
            title: "Warning",
            description: `Could not load sentiment data for ${selectedCoin}. Trying next coin.`,
            variant: "destructive",
          });
          setSentimentData(null);
          
          // Try the next coin if available
          const currentIndex = availableCoins.indexOf(selectedCoin);
          if (currentIndex < availableCoins.length - 1) {
            setSelectedCoin(availableCoins[currentIndex + 1]);
          }
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
      controller.abort();
    };
  }, [selectedCoin, toast, availableCoins]);

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