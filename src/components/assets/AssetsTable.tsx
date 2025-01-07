import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PredictionTrade {
  symbol: string;
  entry_price: number;
  exit_price: number | null;
  amount: number;
  profit_loss: number | null;
  type: string;
  status: string;
}

export const AssetsTable = () => {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['prediction-trades-table'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prediction_trades')
        .select('*')
        .order('profit_loss', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!trades.length) {
    return <p className="text-muted-foreground">No prediction trades found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead className="text-right">Entry Price</TableHead>
          <TableHead className="text-right">Exit Price</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Profit/Loss</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={`${trade.symbol}-${trade.created_at}`}>
            <TableCell className="font-medium">{trade.symbol}</TableCell>
            <TableCell className="text-right">${trade.entry_price.toFixed(2)}</TableCell>
            <TableCell className="text-right">
              {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
            </TableCell>
            <TableCell className="text-right">${trade.amount.toFixed(2)}</TableCell>
            <TableCell className={`text-right ${(trade.profit_loss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trade.profit_loss ? `${(trade.profit_loss >= 0 ? '+' : '')}$${trade.profit_loss.toFixed(2)}` : '-'}
            </TableCell>
            <TableCell className="capitalize">{trade.type}</TableCell>
            <TableCell className="capitalize">{trade.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};