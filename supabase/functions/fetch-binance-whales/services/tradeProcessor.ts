import type { BinanceTrade, WhaleTrade } from '../utils/types.ts';

const WHALE_THRESHOLD = 1000; // Lowered threshold to capture more trades ($1000)

export function processTradesForWhales(
  trades: BinanceTrade[],
  symbol: string,
  userId: string
): WhaleTrade[] {
  console.log(`Processing ${trades.length} trades for ${symbol}`);
  
  const whaleTrades: WhaleTrade[] = [];

  for (const trade of trades) {
    const price = parseFloat(trade.price);
    const quantity = parseFloat(trade.qty);
    const tradeValue = price * quantity;

    if (tradeValue >= WHALE_THRESHOLD) {
      console.log(`Found whale trade for ${symbol}: $${tradeValue}`);
      
      whaleTrades.push({
        user_id: userId,
        symbol: symbol,
        amount: tradeValue,
        price: price,
        trade_type: trade.isBuyer ? 'buy' : 'sell',
        timestamp: new Date(trade.time),
      });
    }
  }

  console.log(`Found ${whaleTrades.length} whale trades for ${symbol}`);
  return whaleTrades;
}