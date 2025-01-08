import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { SentimentData } from "@/components/coins/types";

interface AllCoinsData {
  [key: string]: SentimentData;
}

const RETRY_DELAY = 5000; // 5 seconds delay before retry
const MAX_RETRIES = 2;

export function useAllCoinsSentiment() {
  const [loading, setLoading] = useState(true);
  const [allCoinsData, setAllCoinsData] = useState<AllCoinsData>({});
  const { toast } = useToast();

  useEffect(() => {
    let retryCount = 0;

    const fetchAllCoinsData = async () => {
      try {
        setLoading(true);
        // First fetch all available coins
        const coinsResponse = await fetch('https://crypto.techrealm.pk/coin/search');
        if (!coinsResponse.ok) throw new Error('Failed to fetch coins');
        const { coins } = await coinsResponse.json();

        // Then fetch sentiment data for each coin
        const allData: AllCoinsData = {};
        await Promise.all(
          coins.map(async (coin: string) => {
            try {
              const response = await fetch(`https://crypto.techrealm.pk/coin/${coin}`);
              if (response.ok) {
                const data = await response.json();
                allData[coin] = data;
              }
            } catch (error) {
              console.error(`Error fetching data for ${coin}:`, error);
              // Skip failed coins silently
            }
          })
        );

        setAllCoinsData(allData);
      } catch (error) {
        console.error('Error fetching all coins data:', error);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(fetchAllCoinsData, RETRY_DELAY);
        } else {
          toast({
            title: "Warning",
            description: "Could not load all coins data. Some information may be missing.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllCoinsData();
  }, [toast]);

  return { allCoinsData, loading };
}