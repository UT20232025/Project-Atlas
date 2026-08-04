import type {
  BinanceTicker,
  MarketTicker,
} from "../types/market";

const BINANCE_API_URL = "https://api.binance.com/api/v3";

export type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
];

export async function fetchTicker(
  symbol: string
): Promise<MarketTicker> {
  const response = await fetch(
    `${BINANCE_API_URL}/ticker/24hr?symbol=${symbol}`,
    {
      next: { revalidate: 10 },
    }
  );

  if (!response.ok) {
    throw new Error(`Could not fetch market data for ${symbol}`);
  }

  const data = (await response.json()) as BinanceTicker;

  return {
    coin: data.symbol,
    price: Number(data.lastPrice).toFixed(2),
    change: Number(data.priceChangePercent).toFixed(2),
    volume: Number(data.quoteVolume).toFixed(0),
  };
}

export async function fetchKlines(
  symbol: string,
  interval = "1h",
  limit = 250
): Promise<BinanceKline[]> {
  const response = await fetch(
    `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error(`Could not fetch candles for ${symbol}`);
  }

  return (await response.json()) as BinanceKline[];
}

export async function fetchKlineCloses(
  symbol: string,
  interval = "1h",
  limit = 200
): Promise<number[]> {
  const klines = await fetchKlines(symbol, interval, limit);

  return klines.map((candle) => Number(candle[4]));
}

