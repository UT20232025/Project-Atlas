import {
  analyzeMarket,
  type AtlasAnalysis,
} from "@/lib/atlas/atlasEngine";
import {
  calculateAtlasIndicators,
  type AtlasIndicatorResult,
} from "@/lib/atlas/atlasIndicators";
import {
  analyzeMultiTimeframe,
  type AtlasMtfResult,
  type AtlasTimeframe,
  type AtlasTimeframeAnalysis,
  type AtlasTimeframeRole,
} from "@/lib/atlas/multiTimeframe";
import {
  calculateSupportResistance,
  type AtlasPriceLevels,
} from "@/lib/atlas/supportResistance";
import {
  analyzeTrend,
  type TrendEngineResult,
} from "@/lib/atlas/trendEngine";
import {
  applyTrendFilter,
  type AtlasTrendFilterResult,
} from "@/lib/atlas/trendFilter";
import { createTradeSetup } from "@/lib/atlas/tradeSetup";
import {
  fetchBinanceCandles,
  type BinanceInterval,
} from "@/lib/services/binanceCandleService";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

type BinanceCandles = Awaited<
  ReturnType<typeof fetchBinanceCandles>
>;

type AtlasTimeframeSnapshot = {
  interval: BinanceInterval;
  candles: BinanceCandles;
  analysis: AtlasAnalysis;
  indicators: AtlasIndicatorResult;
  trend: TrendEngineResult;
  trendFilter: AtlasTrendFilterResult;
  priceLevels: AtlasPriceLevels;
};

export type AtlasAnalysisResponse = {
  analysis: AtlasAnalysis;
  indicators: AtlasIndicatorResult;
  trend: TrendEngineResult;
  trendFilter: AtlasTrendFilterResult;
  multiTimeframe: AtlasMtfResult;
  priceLevels: AtlasPriceLevels;
  tradeSetup: ReturnType<typeof createTradeSetup>;
};

const MTF_TIMEFRAMES: AtlasTimeframe[] = [
  "15m",
  "1h",
  "4h",
];

const TIMEFRAME_ROLES: Record<
  AtlasTimeframe,
  AtlasTimeframeRole
> = {
  "15m": "TIMING",
  "1h": "PRIMARY",
  "4h": "MACRO",
};

async function createTimeframeSnapshot(
  symbol: MarketSymbol,
  interval: BinanceInterval
): Promise<AtlasTimeframeSnapshot> {
  const candles = await fetchBinanceCandles(
    symbol,
    interval,
    250
  );

  if (candles.length < 50) {
    throw new Error(
      `Not enough candle data to analyze ${symbol} on ${interval}.`
    );
  }

  const indicators =
    calculateAtlasIndicators(candles);

  const analysis =
    analyzeMarket(indicators);

  const trend =
    analyzeTrend(indicators);

  const trendFilter =
    applyTrendFilter({
      signal: analysis.signal,
      confidence: analysis.confidence,
      risk: analysis.risk,
      trendStatus: indicators.trendStatus,
    });

  const priceLevels =
    calculateSupportResistance(candles);

  return {
    interval,
    candles,
    analysis,
    indicators,
    trend,
    trendFilter,
    priceLevels,
  };
}

function getSnapshot(
  snapshots: Map<
    BinanceInterval,
    AtlasTimeframeSnapshot
  >,
  interval: BinanceInterval
): AtlasTimeframeSnapshot {
  const snapshot =
    snapshots.get(interval);

  if (!snapshot) {
    throw new Error(
      `Atlas analysis snapshot was not created for ${interval}.`
    );
  }

  return snapshot;
}

export async function getAtlasAnalysis(
  symbol: MarketSymbol,
  interval: BinanceInterval = "1h"
): Promise<AtlasAnalysisResponse> {
  const requiredIntervals =
    Array.from(
      new Set<BinanceInterval>([
        interval,
        ...MTF_TIMEFRAMES,
      ])
    );

  const snapshotResults =
    await Promise.all(
      requiredIntervals.map(
        (requiredInterval) =>
          createTimeframeSnapshot(
            symbol,
            requiredInterval
          )
      )
    );

  const snapshots =
    new Map<
      BinanceInterval,
      AtlasTimeframeSnapshot
    >();

  for (const snapshot of snapshotResults) {
    snapshots.set(
      snapshot.interval,
      snapshot
    );
  }

  const requestedSnapshot =
    getSnapshot(
      snapshots,
      interval
    );

  const timeframeAnalyses:
    AtlasTimeframeAnalysis[] =
    MTF_TIMEFRAMES.map(
      (timeframe) => {
        const snapshot =
          getSnapshot(
            snapshots,
            timeframe
          );

        return {
          timeframe,
          role:
            TIMEFRAME_ROLES[
              timeframe
            ],
          trend:
            snapshot.trend,
          trendFilter:
            snapshot.trendFilter,
        };
      }
    );

  const multiTimeframe =
    analyzeMultiTimeframe(
      timeframeAnalyses
    );

  const primarySnapshot =
    getSnapshot(
      snapshots,
      "1h"
    );

  const tradeSetup =
    createTradeSetup({
      candles:
        requestedSnapshot.candles,
      signal:
        multiTimeframe.signal,
      confidence:
        multiTimeframe.confidence,
      risk:
        primarySnapshot
          .trendFilter.risk,
      priceLevels:
        requestedSnapshot.priceLevels,
    });

  return {
    analysis:
      requestedSnapshot.analysis,
    indicators:
      requestedSnapshot.indicators,
    trend:
      requestedSnapshot.trend,
    trendFilter:
      requestedSnapshot.trendFilter,
    multiTimeframe,
    priceLevels:
      requestedSnapshot.priceLevels,
    tradeSetup,
  };
}