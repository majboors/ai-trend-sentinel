import { createHmac } from '../utils/hmac.ts';
import { MarginAsset, BinanceTrade } from '../utils/types.ts';

export async function fetchMarginAccount(apiKey: string, apiSecret: string): Promise<MarginAsset[]> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = await createHmac(apiSecret, queryString);

  console.log("Fetching isolated margin account details...");
  console.log("Request URL:", `https://api.binance.com/sapi/v1/margin/isolated/account?${queryString}&signature=${signature}`);

  const response = await fetch(
    `https://api.binance.com/sapi/v1/margin/isolated/account?${queryString}&signature=${signature}`,
    {
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Binance API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log("Successfully fetched margin account details. Number of assets:", data.assets?.length);
  console.log("Assets:", JSON.stringify(data.assets, null, 2));

  return data.assets || [];
}

export async function fetchTradesForSymbol(
  symbol: string,
  apiKey: string,
  apiSecret: string
): Promise<BinanceTrade[]> {
  const timestamp = Date.now();
  const queryString = `symbol=${symbol}&isIsolated=TRUE&limit=1000&timestamp=${timestamp}`;
  const signature = await createHmac(apiSecret, queryString);

  console.log(`Fetching trades for ${symbol}...`);
  console.log("Trade request URL:", `https://api.binance.com/sapi/v1/margin/myTrades?${queryString}&signature=${signature}`);

  const response = await fetch(
    `https://api.binance.com/sapi/v1/margin/myTrades?${queryString}&signature=${signature}`,
    {
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error details: ${errorText}`);
    throw new Error(`Failed to fetch trades for ${symbol}: ${response.statusText}`);
  }

  const trades = await response.json();
  console.log(`Found ${trades.length} trades for ${symbol}`);
  return trades;
}