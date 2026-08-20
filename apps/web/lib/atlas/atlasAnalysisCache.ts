import { MARKET_SYMBOLS } from "@/lib/config/markets";
import {
  getAtlasAnalysis,
  type AtlasAnalysisResponse,
} from "@/lib/atlas/getAtlasAnalysis";
import { recordSignalIfChanged } from "@/lib/atlas/signalHistory";
import type { BinanceInterval } from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import { notifyPushSignalChange } from "@/lib/push/notifySignal";
import {
  getLastBroadcastDirection,
  isBroadcastWorthy,
  setLastBroadcastDirection,
  shouldBroadcastSignal,
} from "@/lib/signals/broadcastCooldown";
import { notifyReversal } from "@/lib/signals/notifyReversal";
import { notifySignalChange } from "@/lib/telegram/notify";
import { notifyBreakout } from "@/lib/signals/notifyBreakout";

// Must comfortably exceed the dashboard's 30s poll interval (MarketProvider,
// ScannerSignalsProvider), otherwise every poll hits a cold cache and
// re-triggers a full recompute (~60 concurrent Binance calls across
// 20 symbols x 3 timeframes) instead of reusing the cached result. Set well
// above the poll so most polls reuse the cache — live prices still come
// straight from Binance via MarketProvider; only the Atlas read is cached.
const CACHE_TTL_MS = 90_000;

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

      // Record every change (above) for the track record, but debounce the
      // BROADCASTS so a flapping signal can't spam the channel with the same
      // coin+direction repeatedly.
      const decision = result.decision;

      if (
        changed &&
        isBroadcastWorthy(decision.signal, decision.confidence) &&
        shouldBroadcastSignal(symbol, decision.signal)
      ) {
        const direction = decision.signal as "LONG" | "SHORT";
        const previous = getLastBroadcastDirection(symbol);

        // An opposite-direction flip means anyone in the old trade should
        // consider exiting / protecting profit.
        if (previous && previous !== direction) {
          void notifyReversal(symbol, previous, direction);
        }

        // When the trade-setup engine produced a valid scale-out ladder,
        // broadcast all three targets (with its coherent entry/SL/R:R)
        // instead of the single decision take-profit.
        const tradeSetup = result.tradeSetup;
        const broadcastDecision =
          tradeSetup && tradeSetup.takeProfit1 != null
            ? {
                ...decision,
                entry: tradeSetup.entry ?? decision.entry,
                stopLoss: tradeSetup.stopLoss ?? decision.stopLoss,
                riskRewardRatio:
                  tradeSetup.riskReward2 ?? decision.riskRewardRatio,
                takeProfit1: tradeSetup.takeProfit1,
                takeProfit2: tradeSetup.takeProfit2,
                takeProfit3: tradeSetup.takeProfit3,
              }
            : decision;

        void notifySignalChange(symbol, broadcastDecision);
        void notifyPushSignalChange(symbol, broadcastDecision);
        setLastBroadcastDirection(symbol, direction);
      }

      // Breakout broadcast — fires independently of decision.signal (which sits
      // on WAIT through a fast move), debounced per symbol+direction like a
      // signal so a persistent breakout doesn't re-alert.
      const breakout = result.breakout;
      if (
        breakout.detected &&
        breakout.direction &&
        shouldBroadcastSignal(symbol, `BREAKOUT_${breakout.direction}`)
      ) {
        void notifyBreakout(symbol, breakout);
      }
    });
  }

  return promise;
}
