import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { SentimentData } from "@/components/coins/types";

interface AllCoinsData {
  [key: string]: SentimentData;
}

export function useAllCoinsSentiment() {
  const [loading, setLoading] = useState(true);
  const [allCoinsData, setAllCoinsData] = useState<AllCoinsData>({});
  const { toast } = useToast();

  useEffect(() => {
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
            }
          })
        );

        setAllCoinsData(allData);
      } catch (error) {
        console.error('Error fetching all coins data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch coins data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllCoinsData();
  }, [toast]);

  return { allCoinsData, loading };
}