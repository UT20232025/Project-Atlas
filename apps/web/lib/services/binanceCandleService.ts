import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

export type BinanceInterval =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d";

type BinanceKline = [
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

const BINANCE_API_URL =
  "https://api.binance.com/api/v3/klines";

const BINANCE_REQUEST_TIMEOUT_MS = 10_000;

export async function fetchBinanceCandles(
  symbol: MarketSymbol,
  interval: BinanceInterval = "1h",
  limit = 100
): Promise<AtlasCandle[]> {
  const safeLimit = Math.min(
    Math.max(limit, 50),
    500
  );

  const searchParams = new URLSearchParams({
    symbol,
    interval,
    limit: safeLimit.toString(),
  });

  const response = await fetch(
    `${BINANCE_API_URL}?${searchParams.toString()}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(
        BINANCE_REQUEST_TIMEOUT_MS
      ),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Binance candles: ${response.status}`
    );
  }

  const data =
    (await response.json()) as BinanceKline[];

  if (!Array.isArray(data)) {
    throw new Error(
      "Invalid candlestick data received from Binance."
    );
  }

  return data.map((kline) => ({
    open: Number(kline[1]),
    high: Number(kline[2]),
    low: Number(kline[3]),
    close: Number(kline[4]),
    volume: Number(kline[5]),
  }));
}

export async function fetchHistoricalCandleRange(
  symbol: MarketSymbol,
  interval: BinanceInterval,
  startTimeMs: number,
  endTimeMs: number
): Promise<AtlasCandle[]> {
  const candles: AtlasCandle[] = [];
  let cursor = startTimeMs;

  while (cursor < endTimeMs) {
    const searchParams = new URLSearchParams({
      symbol,
      interval,
      startTime: String(cursor),
      endTime: String(endTimeMs),
      limit: "1000",
    });

    const response = await fetch(
      `${BINANCE_API_URL}?${searchParams.toString()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch historical Binance candles: ${response.status}`
      );
    }

    const data = (await response.json()) as BinanceKline[];

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    for (const kline of data) {
      candles.push({
        timestamp: Number(kline[0]),
        open: Number(kline[1]),
        high: Number(kline[2]),
        low: Number(kline[3]),
        close: Number(kline[4]),
        volume: Number(kline[5]),
      });
    }

    const lastOpenTime = Number(data[data.length - 1][0]);

    if (data.length < 1000 || lastOpenTime <= cursor) {
      break;
    }

    cursor = lastOpenTime + 1;
  }

  return candles;
}

export async function fetchHistoricalClosePrice(
  symbol: MarketSymbol,
  interval: BinanceInterval,
  atOrBeforeMs: number
): Promise<number | null> {
  const searchParams = new URLSearchParams({
    symbol,
    interval,
    endTime: String(atOrBeforeMs),
    limit: "1",
  });

  try {
    const response = await fetch(
      `${BINANCE_API_URL}?${searchParams.toString()}`,
      {
        cache: "force-cache",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as BinanceKline[];

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return Number(data[0][4]);
  } catch {
    return null;
  }
}