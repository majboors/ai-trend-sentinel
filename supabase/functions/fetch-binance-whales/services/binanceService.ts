import { createHmac } from '../utils/hmac.ts';
import { MarginAsset, BinanceTrade } from '../utils/types.ts';

export async function fetchMarginAccount(apiKey: string, apiSecret: string): Promise<MarginAsset[]> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = await createHmac(apiSecret, queryString);

  console.log("Fetching isolated margin account details...");

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
  return data.assets || [];
}

export async function fetchCrossMarginAccount(apiKey: string, apiSecret: string): Promise<any[]> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = await createHmac(apiSecret, queryString);

  console.log("Fetching cross margin account details...");

  const response = await fetch(
    `https://api.binance.com/sapi/v1/margin/account?${queryString}&signature=${signature}`,
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
  console.log("Successfully fetched cross margin account details");
  return data.userAssets || [];
}

export async function fetchSpotAccount(apiKey: string, apiSecret: string): Promise<any[]> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = await createHmac(apiSecret, queryString);

  console.log("Fetching spot account details...");

  const response = await fetch(
    `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
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
  console.log("Successfully fetched spot account details");
  return data.balances || [];
}

export async function fetchAllTradingPairs(apiKey: string): Promise<string[]> {
  console.log("Fetching all trading pairs...");
  
  const response = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
    headers: {
      "X-MBX-APIKEY": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch trading pairs: ${response.statusText}`);
  }

  const data = await response.json();
  // Get all trading pairs that are currently active
  const pairs = data.symbols
    .filter((symbol: any) => 
      symbol.status === 'TRADING' && 
      symbol.isSpotTradingAllowed
    )
    .map((symbol: any) => symbol.symbol);
  
  console.log(`Found ${pairs.length} active trading pairs`);
  return pairs;
}

export async function fetchTradesForSymbol(
  symbol: string,
  apiKey: string,
  apiSecret: string,
  accountType: 'spot' | 'margin' | 'cross'
): Promise<BinanceTrade[]> {
  const timestamp = Date.now();
  let endpoint = '';
  let queryString = '';

  switch (accountType) {
    case 'spot':
      endpoint = 'https://api.binance.com/api/v3/myTrades';
      queryString = `symbol=${symbol}&limit=1000&timestamp=${timestamp}`;
      break;
    case 'margin':
      endpoint = 'https://api.binance.com/sapi/v1/margin/myTrades';
      queryString = `symbol=${symbol}&isIsolated=TRUE&limit=1000&timestamp=${timestamp}`;
      break;
    case 'cross':
      endpoint = 'https://api.binance.com/sapi/v1/margin/myTrades';
      queryString = `symbol=${symbol}&isIsolated=FALSE&limit=1000&timestamp=${timestamp}`;
      break;
  }

  const signature = await createHmac(apiSecret, queryString);

  console.log(`Fetching ${accountType} trades for ${symbol}...`);

  const response = await fetch(
    `${endpoint}?${queryString}&signature=${signature}`,
    {
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error details for ${symbol}: ${errorText}`);
    throw new Error(`Failed to fetch ${accountType} trades for ${symbol}: ${response.statusText}`);
  }

  const trades = await response.json();
  console.log(`Found ${trades.length} ${accountType} trades for ${symbol}`);
  return trades;
}