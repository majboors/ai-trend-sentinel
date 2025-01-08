import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownIcon, ArrowUpIcon, Loader2Icon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type WhaleTrade = Database['public']['Tables']['whale_trades']['Row'];

export function WhalesActivity() {
  const [whales, setWhales] = useState<WhaleTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWhales = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch whale trades...');

        // First try to get cached whale trades from Supabase
        const { data: whaleData, error: dbError } = await supabase
          .from('whale_trades')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(20);

        if (dbError) {
          console.error('Error fetching cached whale trades:', dbError);
          throw dbError;
        }

        if (whaleData) {
          console.log('Found cached whale trades:', whaleData.length);
          setWhales(whaleData);
        }

        // Then fetch fresh data from Binance
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No authenticated session found');
          throw new Error('No authenticated session');
        }

        console.log('Invoking fetch-binance-whales function...');
        const response = await supabase.functions.invoke('fetch-binance-whales', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.error) {
          console.error('Error from fetch-binance-whales:', response.error);
          throw response.error;
        }

        console.log('Successfully fetched fresh whale trades');

      } catch (err) {
        console.error('Error in fetchWhales:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch whale trades');
      } finally {
        setLoading(false);
      }
    };

    fetchWhales();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('whale_trades')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'whale_trades' 
        }, 
        payload => {
          console.log('Received new whale trade:', payload);
          setWhales(current => {
            const newTrade = payload.new as WhaleTrade;
            // Check if trade already exists to prevent duplicates
            if (!current.some(trade => trade.id === newTrade.id)) {
              return [newTrade, ...current.slice(0, 19)];
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2Icon className="h-5 w-5 animate-spin" />
          <h3 className="text-sm font-medium text-muted-foreground">Loading whale activity...</h3>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card p-6">
        <h3 className="text-sm font-medium text-destructive mb-4">Error: {error}</h3>
      </Card>
    );
  }

  if (!whales || whales.length === 0) {
    return (
      <Card className="glass-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">No whale activity found</h3>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Market Activity</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {whales.map((whale) => (
            <TableRow key={whale.id}>
              <TableCell className="font-mono">{whale.symbol}</TableCell>
              <TableCell>${whale.price.toFixed(2)}</TableCell>
              <TableCell className={`flex items-center gap-1 ${whale.trade_type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                {whale.trade_type === 'buy' ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
                ${Math.abs(whale.amount).toLocaleString()}
              </TableCell>
              <TableCell>{formatDistanceToNow(new Date(whale.timestamp), { addSuffix: true })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}