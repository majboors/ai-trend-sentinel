import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type VolatileTradeRow = Database['public']['Tables']['volatile_trades']['Row'];
type VolatileTradeInsert = Database['public']['Tables']['volatile_trades']['Insert'];

export interface VolatileTrade extends VolatileTradeRow {}

export async function createVolatileTrade(trade: Omit<VolatileTradeInsert, 'id' | 'status' | 'created_at'>): Promise<VolatileTrade> {
  const { data, error } = await supabase
    .from('volatile_trades')
    .insert({
      ...trade,
      status: 'open',
    })
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