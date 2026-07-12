import type {
  BinanceTicker,
  MarketTicker,
  TopMover,
} from "../types/market";

const BINANCE_API_URL = "https://api.binance.com/api/v3";

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
    throw new Error(`Kunne ikke hente markedsdata for ${symbol}`);
  }

  const data = (await response.json()) as BinanceTicker;

  return {
    coin: data.symbol,
    price: Number(data.lastPrice).toFixed(2),
    change: Number(data.priceChangePercent).toFixed(2),
    volume: Number(data.quoteVolume).toFixed(0),
  };
}

export async function fetchKlineCloses(
  symbol: string,
  interval = "1h",
  limit = 200
): Promise<number[]> {
  const response = await fetch(
    `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error(`Kunne ikke hente candles for ${symbol}`);
  }

  const data = (await response.json()) as unknown[][];

  return data.map((candle) => Number(candle[4]));
}

export async function fetchTopMovers(): Promise<TopMover[]> {
  const response = await fetch(
    `${BINANCE_API_URL}/ticker/24hr`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Kunne ikke hente Top Movers");
  }

  const data = (await response.json()) as BinanceTicker[];

  return data
    .filter((item) => item.symbol.endsWith("USDT"))
    .filter((item) => Number(item.quoteVolume) > 50_000_000)
    .sort(
      (a, b) =>
        Math.abs(Number(b.priceChangePercent)) -
        Math.abs(Number(a.priceChangePercent))
    )
    .slice(0, 5)
    .map((item) => ({
      coin: item.symbol,
      price: Number(item.lastPrice).toFixed(4),
      change: Number(item.priceChangePercent).toFixed(2),
    }));
}