import {
  getAtlasAnalysis,
  type AtlasAnalysisResponse,
} from "@/lib/atlas/getAtlasAnalysis";
import { recordSignalIfChanged } from "@/lib/atlas/signalHistory";
import type { BinanceInterval } from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import { notifySignalChange } from "@/lib/telegram/notify";

const CACHE_TTL_MS = 25_000;

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
    expiresAt: Date.now() + CACHE_TTL_MS,
    promise,
  });

  promise.catch(() => {
    if (cache.get(key)?.promise === promise) {
      cache.delete(key);
    }
  });

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

  return promise;
}
