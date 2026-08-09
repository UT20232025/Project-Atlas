import { MARKET_SYMBOLS } from "@/lib/config/markets";
import {
  getAtlasAnalysis,
  type AtlasAnalysisResponse,
} from "@/lib/atlas/getAtlasAnalysis";
import { recordSignalIfChanged } from "@/lib/atlas/signalHistory";
import type { BinanceInterval } from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import { notifySignalChange } from "@/lib/telegram/notify";

// Must exceed the dashboard's 30s poll interval (MarketProvider,
// ScannerSignalsProvider), otherwise every poll hits a cold cache and
// re-triggers a full recompute (~60 concurrent Binance calls across
// 20 symbols x 3 timeframes) instead of reusing the cached result.
const CACHE_TTL_MS = 35_000;

// Higher timeframes barely move intraday, so cache them far longer — this
// keeps the daily swing scanner (20 symbols x 1d) from cold-recomputing on
// every dashboard load, which was the main source of dashboard slowness.
const LONG_CACHE_TTL_MS = 10 * 60_000;

function ttlForInterval(interval: BinanceInterval): number {
  return interval === "4h" || interval === "1d"
    ? LONG_CACHE_TTL_MS
    : CACHE_TTL_MS;
}

type CacheEntry = {
  expiresAt: number;
  promise: Promise<AtlasAnalysisResponse>;
};

const cache = new Map<string, CacheEntry>();

function getCacheKey(
  symbol: MarketSymbol,
  interval: BinanceInterval
): string {
  return `${symbol}:${interval}`;
}

export function getCachedAtlasAnalysis(
  symbol: MarketSymbol,
  interval: BinanceInterval = "1h"
): Promise<AtlasAnalysisResponse> {
  const key = getCacheKey(symbol, interval);
  const existingEntry = cache.get(key);

  if (existingEntry && existingEntry.expiresAt > Date.now()) {
    return existingEntry.promise;
  }

  const promise = getAtlasAnalysis(symbol, interval);

  cache.set(key, {
    expiresAt: Date.now() + ttlForInterval(interval),
    promise,
  });

  promise.catch(() => {
    if (cache.get(key)?.promise === promise) {
      cache.delete(key);
    }
  });

  // Only the curated MARKET_SYMBOLS feed the verified track record and
  // the Telegram channel. Ad-hoc coins reached via search are analyzed
  // and cached, but never recorded or broadcast — so the public track
  // record stays "our 20 curated calls", not "anything anyone searched".
  // And only the canonical 1h timeframe is recorded/broadcast: coin pages
  // can now request other timeframes (4h, 1d, …) for browsing, and those
  // must not pollute the 1h-based track record or spam the channel.
  const isCurated =
    interval === "1h" &&
    (MARKET_SYMBOLS as readonly string[]).includes(symbol);

  if (isCurated) {
    promise.then(async (result) => {
      const { changed } = await recordSignalIfChanged(
        symbol,
        interval,
        result.decision
      );

      if (changed) {
        void notifySignalChange(symbol, result.decision);
      }
    });
  }

  return promise;
}
