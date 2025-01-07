import { supabase } from "@/integrations/supabase/client";

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface MarginBalance {
  asset: string;
  borrowed: string;
  free: string;
  interest: string;
  locked: string;
  netAsset: string;
}

export async function fetchBinanceBalances() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw new Error(`Session error: ${sessionError.message}`);
    if (!session?.user) throw new Error('No authenticated session found');

    console.log('Fetching spot balances with user ID:', session.user.id);
    const { data: spotBalances, error: spotError } = await supabase.functions.invoke(
      'fetch-binance-spot',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (spotError) {
      console.error('Spot balance error:', spotError);
      throw spotError;
    }

    console.log('Spot balances received:', spotBalances);

    // Update spot balances in database
    if (spotBalances && Array.isArray(spotBalances)) {
      for (const balance of spotBalances) {
        if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
          const { error: upsertError } = await supabase
            .from('assets')
            .upsert(
              {
                user_id: session.user.id,
                symbol: balance.asset,
                free: parseFloat(balance.free),
                locked: parseFloat(balance.locked),
                account_type: 'spot',
                last_updated: new Date().toISOString(),
              },
              {
                onConflict: 'user_id,symbol,account_type'
              }
            );

          if (upsertError) {
            console.error('Error upserting spot asset:', upsertError);
            throw upsertError;
          }
        }
      }
    }

    console.log('Fetching margin balances...');
    const { data: marginBalances, error: marginError } = await supabase.functions.invoke(
      'fetch-binance-margin',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (marginError) {
      console.error('Margin balance error:', marginError);
      throw marginError;
    }

    console.log('Margin balances received:', marginBalances);

    // Update margin balances in database
    if (marginBalances && Array.isArray(marginBalances)) {
      for (const balance of marginBalances) {
        if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
          const { error: upsertError } = await supabase
            .from('assets')
            .upsert(
              {
                user_id: session.user.id,
                symbol: balance.asset,
                free: parseFloat(balance.free),
                locked: parseFloat(balance.locked),
                account_type: 'margin',
                last_updated: new Date().toISOString(),
              },
              {
                onConflict: 'user_id,symbol,account_type'
              }
            );

          if (upsertError) {
            console.error('Error upserting margin asset:', upsertError);
            throw upsertError;
          }
        }
      }
    }
    
    return {
      spot: spotBalances,
      margin: marginBalances,
    };
  } catch (error) {
    console.error('Error fetching balances:', error);
    throw error;
  }
}