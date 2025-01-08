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
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface WhaleTrade {
  id: string;
  symbol: string;
  amount: number;
  trade_type: 'buy' | 'sell';
  timestamp: string;
}

export function WhalesActivity() {
  const [whales, setWhales] = useState<WhaleTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWhales = async () => {
      try {
        // First try to get cached whale trades from Supabase
        const { data: whaleData, error: dbError } = await supabase
          .from('whale_trades')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10);

        if (dbError) throw dbError;

        if (whaleData) {
          setWhales(whaleData);
        }

        // Then fetch fresh data from Binance
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No authenticated session');

        const response = await supabase.functions.invoke('fetch-binance-whales', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.error) throw response.error;

      } catch (err) {
        console.error('Error fetching whale trades:', err);
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
          setWhales(current => [payload.new as WhaleTrade, ...current.slice(0, 9)]);
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
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Loading whale activity...</h3>
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

  return (
    <Card className="glass-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Whales Activity</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {whales.map((whale) => (
            <TableRow key={whale.id}>
              <TableCell className="font-mono">{whale.symbol}</TableCell>
              <TableCell className={`flex items-center gap-1 ${whale.trade_type === 'buy' ? 'profit' : 'loss'}`}>
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