import { BinanceTrade, WhaleTrade } from '../utils/types.ts';

const WHALE_THRESHOLD = 1000; // Lower threshold to $1000 to show more trades

export function processTradesForWhales(
  trades: BinanceTrade[],
  symbol: string,
  userId: string,
  tradeType: 'margin' | 'spot' = 'margin'
): WhaleTrade[] {
  console.log(`Processing ${tradeType} trades for ${symbol}...`);
  
  const processedTrades = trades.map((trade) => {
    const tradeValue = parseFloat(trade.price) * parseFloat(trade.qty);
    
    console.log(`${tradeType.toUpperCase()} Trade details for ${symbol}:
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
      console.log(`Found ${tradeType} whale trade for ${symbol}:
        Amount: $${trade.amount.toFixed(2)}
        Type: ${trade.trade_type}
        Time: ${trade.timestamp}`
      );
    }
    return isWhale;
  });

  console.log(`Found ${whaleTrades.length} whale trades for ${symbol} in ${tradeType} account`);
  return whaleTrades;
}