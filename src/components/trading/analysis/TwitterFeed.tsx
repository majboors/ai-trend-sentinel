import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Tweet {
  tweet_id: string;
  username: string;
  name: string;
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  created_at: string;
}

interface TwitterFeedProps {
  coinSymbol: string;
}

export function TwitterFeed({ coinSymbol }: TwitterFeedProps) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTweets = async () => {
      if (!coinSymbol) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Format the search query with the coin symbol and current date
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const query = `${coinSymbol} ${formattedDate}`;
        
        const response = await fetch(`https://twitter-api47.p.rapidapi.com/v2/search?query=${encodeURIComponent(query)}&type=Top`, {
          headers: {
            'x-rapidapi-key': '786537afe1msh93a10609dcf7592p170f93jsn1bebd7133045',
            'x-rapidapi-host': 'twitter-api47.p.rapidapi.com'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tweets');
        }

        const data = await response.json();
        
        if (!data.tweets || !Array.isArray(data.tweets)) {
          console.log('No tweets found in response:', data);
          setTweets([]);
          return;
        }

        const formattedTweets: Tweet[] = data.tweets
          .filter(tweet => {
            try {
              // Verify the tweet has all required nested properties
              return tweet?.content?.itemContent?.tweet_results?.result?.core?.user_results?.result &&
                     tweet?.content?.itemContent?.tweet_results?.result?.legacy;
            } catch (e) {
              console.log('Invalid tweet structure:', tweet);
              return false;
            }
          })
          .map(tweet => {
            const content = tweet.content.itemContent.tweet_results.result;
            const user = content.core.user_results.result;
            const legacy = content.legacy;

            return {
              tweet_id: content.rest_id,
              username: user.legacy.screen_name,
              name: user.legacy.name,
              text: legacy.full_text,
              likes: legacy.favorite_count,
              retweets: legacy.retweet_count,
              replies: legacy.reply_count,
              created_at: legacy.created_at,
            };
          });

        setTweets(formattedTweets);
      } catch (err) {
        console.error('Error fetching tweets:', err);
        setError('Failed to load tweets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTweets();
  }, [coinSymbol]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading tweets...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <ScrollArea className="h-[calc(100vh-5rem)]">
      <div className="space-y-4 p-4">
        {tweets.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No tweets found for {coinSymbol}
          </div>
        ) : (
          tweets.map((tweet) => (
            <Card key={tweet.tweet_id} className="bg-card">
              <CardContent className="p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{tweet.name}</span>
                    <span className="text-muted-foreground">@{tweet.username}</span>
                  </div>
                  <p className="text-sm">{tweet.text}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>❤️ {tweet.likes}</span>
                    <span>🔁 {tweet.retweets}</span>
                    <span>💬 {tweet.replies}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );
}