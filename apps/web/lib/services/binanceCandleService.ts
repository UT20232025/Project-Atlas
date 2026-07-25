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

const BINANCE_API_URL = "https://api.binance.com/api/v3/klines";

export async function fetchBinanceCandles(
  symbol: MarketSymbol,
  interval: BinanceInterval = "1h",
  limit = 100
): Promise<AtlasCandle[]> {
  const safeLimit = Math.min(Math.max(limit, 50), 500);

  const searchParams = new URLSearchParams({
    symbol,
    interval,
    limit: safeLimit.toString(),
  });

  const response = await fetch(
    `${BINANCE_API_URL}?${searchParams.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Binance candles: ${response.status}`
    );
  }

  const data = (await response.json()) as BinanceKline[];

  if (!Array.isArray(data)) {
    throw new Error("Invalid candlestick data received from Binance.");
  }

  return data.map((kline) => ({
    open: Number(kline[1]),
    high: Number(kline[2]),
    low: Number(kline[3]),
    close: Number(kline[4]),
    volume: Number(kline[5]),
  }));
}