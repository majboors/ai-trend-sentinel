import { supabase } from "@/integrations/supabase/client";

export interface VolatileTrade {
  id: string;
  user_id: string;
  symbol: string;
  entry_price: number;
  exit_price?: number;
  amount: number;
  volatility: number;
  status: 'open' | 'closed' | 'cancelled';
  profit_loss?: number;
  created_at?: string;
  closed_at?: string;
  high_price: number;
  low_price: number;
}

export async function createVolatileTrade(trade: Omit<VolatileTrade, 'id' | 'status' | 'created_at'>): Promise<VolatileTrade> {
  const { data, error } = await supabase
    .from('volatile_trades')
    .insert(trade)
    .select()
    .single();

  if (error) {
    console.error('Error creating volatile trade:', error);
    throw error;
  }

  return data;
}

export function subscribeToVolatileTrades(callback: (payload: any) => void) {
  return supabase
    .channel('volatile-trades-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'volatile_trades' },
      callback
    )
    .subscribe();
}