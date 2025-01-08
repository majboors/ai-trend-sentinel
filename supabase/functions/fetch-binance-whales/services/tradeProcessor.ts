import { BinanceTrade, WhaleTrade } from '../utils/types.ts';

const WHALE_THRESHOLD = 100000; // $100k threshold

export function processTradesForWhales(
  trades: BinanceTrade[],
  symbol: string,
  userId: string
): WhaleTrade[] {
  const processedTrades = trades.map((trade) => {
    const tradeValue = parseFloat(trade.price) * parseFloat(trade.qty);
    
    console.log(`Trade details for ${symbol}:
      ID: ${trade.id}
      Price: ${trade.price}
      Quantity: ${trade.qty}
      Total Value: $${tradeValue.toFixed(2)}
      Side: ${trade.isBuyer ? 'BUY' : 'SELL'}
      Time: ${new Date(trade.time).toISOString()}`
    );

    return {
      user_id: userId,
      symbol: trade.symbol,
      amount: tradeValue,
      price: parseFloat(trade.price),
      trade_type: trade.isBuyer ? 'buy' : 'sell',
      timestamp: new Date(trade.time),
    };
  });

  const whaleTrades = processedTrades.filter((trade) => {
    const isWhale = trade.amount > WHALE_THRESHOLD;
    if (isWhale) {
      console.log(`Found whale trade for ${symbol}:
        Amount: $${trade.amount.toFixed(2)}
        Type: ${trade.trade_type}
        Time: ${trade.timestamp}`
      );
    }
    return isWhale;
  });

  console.log(`Found ${whaleTrades.length} whale trades for ${symbol}`);
  return whaleTrades;
}