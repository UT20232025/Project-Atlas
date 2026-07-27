import {
  analyzeMarket,
  type AtlasAnalysis,
} from "@/lib/atlas/atlasEngine";

import {
  analyzeOrderBlocks,
  type OrderBlockResult,
} from "./orderBlockEngine";

import {
  calculateAtlasIndicators,
  type AtlasIndicatorResult,
} from "@/lib/atlas/atlasIndicators";

import {
  makeAtlasDecision,
  type AtlasDecisionEngineResult,
} from "@/lib/atlas/aiDecisionEngine";

import {
  analyzeLiquidity,
  type LiquidityResult,
} from "@/lib/atlas/liquidityEngine";
import {
  analyzeVolume,
  type VolumeAnalysisResult,
} from "@/lib/atlas/volumeEngine";
import {
  analyzeMarketStructure,
  type MarketStructureResult,
} from "@/lib/atlas/marketStructureEngine";
import {
  analyzeMultiTimeframe,
  type AtlasMtfResult,
  type AtlasTimeframe,
  type AtlasTimeframeAnalysis,
  type AtlasTimeframeRole,
} from "@/lib/atlas/multiTimeframeEngine";

import {
  analyzePriceAction,
  type PriceActionResult,
} from "@/lib/atlas/priceActionEngine";

import {
  analyzeRisk,
  type AtlasRiskEngineResult,
  type AtlasTradeDirection,
} from "@/lib/atlas/riskEngine";

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

import {
  createTradeSetup,
} from "@/lib/atlas/tradeSetup";

import {
  fetchBinanceCandles,
  type BinanceInterval,
} from "@/lib/services/binanceCandleService";

import type {
  MarketSymbol,
} from "@/lib/services/liveMarketService";

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
priceAction: PriceActionResult;
liquidity: LiquidityResult;
volume: VolumeAnalysisResult;
marketStructure: MarketStructureResult;
orderBlocks: ReturnType<typeof analyzeOrderBlocks>;
};

export type AtlasAnalysisResponse = {
  signal: AtlasTradeDirection;
  confidence: number;

  orderBlocks: OrderBlockResult;

  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;

  analysis: AtlasAnalysis;
  indicators: AtlasIndicatorResult;

  trend: TrendEngineResult;
  trendFilter: AtlasTrendFilterResult;

  multiTimeframe: AtlasMtfResult;

priceLevels: AtlasPriceLevels;
priceAction: PriceActionResult;
liquidity: LiquidityResult;
volume: VolumeAnalysisResult;
marketStructure: MarketStructureResult;

  risk: AtlasRiskEngineResult;
  decision: AtlasDecisionEngineResult;

  tradeSetup: ReturnType<
    typeof createTradeSetup
  >;
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

function normalizeTradeDirection(
  signal: string
): AtlasTradeDirection {
  if (signal === "LONG") {
    return "LONG";
  }

  if (signal === "SHORT") {
    return "SHORT";
  }

  return "WAIT";
}

function getCurrentPrice(
  candles: BinanceCandles
): number {
  const latestCandle =
    candles[candles.length - 1];

  if (!latestCandle) {
    throw new Error(
      "Atlas could not determine the current market price."
    );
  }

  return latestCandle.close;
}

function calculateAtr(
  candles: BinanceCandles,
  period = 14
): number | null {
  if (candles.length < 2) {
    return null;
  }

  const trueRanges: number[] = [];

  for (
    let index = 1;
    index < candles.length;
    index++
  ) {
    const currentCandle =
      candles[index];

    const previousCandle =
      candles[index - 1];

    const highLowRange =
      currentCandle.high -
      currentCandle.low;

    const highPreviousCloseRange =
      Math.abs(
        currentCandle.high -
          previousCandle.close
      );

    const lowPreviousCloseRange =
      Math.abs(
        currentCandle.low -
          previousCandle.close
      );

    trueRanges.push(
      Math.max(
        highLowRange,
        highPreviousCloseRange,
        lowPreviousCloseRange
      )
    );
  }

  if (trueRanges.length === 0) {
    return null;
  }

  const selectedRanges =
    trueRanges.slice(
      -Math.min(
        period,
        trueRanges.length
      )
    );

  const totalRange =
    selectedRanges.reduce(
      (sum, trueRange) =>
        sum + trueRange,
      0
    );

  const atr =
    totalRange /
    selectedRanges.length;

  if (
    !Number.isFinite(atr) ||
    atr <= 0
  ) {
    return null;
  }

  return atr;
}

async function createTimeframeSnapshot(
  symbol: MarketSymbol,
  interval: BinanceInterval
): Promise<AtlasTimeframeSnapshot> {
  const candles =
    await fetchBinanceCandles(
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
    calculateAtlasIndicators(
      candles
    );

  const analysis =
    analyzeMarket(
      indicators
    );

  const trend =
    analyzeTrend(
      indicators
    );

  const trendFilter =
    applyTrendFilter({
      signal: analysis.signal,
      confidence:
        analysis.confidence,
      risk: analysis.risk,
      trendStatus:
        indicators.trendStatus,
    });

  const priceLevels =
    calculateSupportResistance(
      candles
    );

  const priceAction =
    analyzePriceAction(
      candles
    );

  const liquidity =
    analyzeLiquidity(
      candles
    );
    const volume =
  analyzeVolume(
    candles
  );
  const marketStructure =
  analyzeMarketStructure(
    candles
  );
const orderBlocks = analyzeOrderBlocks(candles);

 return {
  interval,
  candles,

  analysis,
  indicators,

  trend,
  trendFilter,

  priceLevels,
  priceAction,
  liquidity,
  volume,
  marketStructure,
  orderBlocks,
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
        (
          requiredInterval
        ) =>
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

  for (
    const snapshot
    of snapshotResults
  ) {
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

  const proposedSignal =
    normalizeTradeDirection(
      multiTimeframe.signal
    );

  const currentPrice =
    getCurrentPrice(
      requestedSnapshot.candles
    );

  const atr =
    calculateAtr(
      requestedSnapshot.candles
    );

  const risk =
    analyzeRisk({
      signal:
        proposedSignal,

      currentPrice,
      atr,

      trend:
        requestedSnapshot.trend,

      multiTimeframe,

      priceAction:
        requestedSnapshot.priceAction,

      liquidity:
        requestedSnapshot.liquidity,
    });

const decision =
  makeAtlasDecision({
    proposedSignal,

    trend:
      requestedSnapshot.trend,

    multiTimeframe,

    priceAction:
      requestedSnapshot.priceAction,

    liquidity:
      requestedSnapshot.liquidity,

    volume:
      requestedSnapshot.volume,

    marketStructure:
      requestedSnapshot.marketStructure,

    risk,
  });

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
  decision.signal === "LONG"
    ? "LONG"
    : decision.signal === "SHORT"
    ? "SHORT"
    : "NEUTRAL",

      confidence:
        decision.confidence,

      risk:
        primarySnapshot
          .trendFilter.risk,

      priceLevels:
        requestedSnapshot
          .priceLevels,
    });

  return {
    orderBlocks:
  requestedSnapshot.orderBlocks,
  
    signal:
      decision.signal,

    confidence:
      decision.confidence,

    entry:
      decision.entry,

    stopLoss:
      decision.stopLoss,

    takeProfit:
      decision.takeProfit,

    riskRewardRatio:
      decision.riskRewardRatio,

    analysis:
      requestedSnapshot.analysis,

    indicators:
      requestedSnapshot.indicators,

    trend:
      requestedSnapshot.trend,

    trendFilter:
      requestedSnapshot
        .trendFilter,

    multiTimeframe,

    priceLevels:
  requestedSnapshot
    .priceLevels,

priceAction:
  requestedSnapshot
    .priceAction,

liquidity:
  requestedSnapshot
    .liquidity,

volume:
  requestedSnapshot
    .volume,

marketStructure:
  requestedSnapshot
    .marketStructure,

risk,
decision,

tradeSetup,
  };
}