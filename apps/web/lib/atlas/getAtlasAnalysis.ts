import {
  analyzeMarket,
  type AtlasAnalysis,
} from "@/lib/atlas/atlasEngine";

import {
  analyzeOrderBlocks,
  type OrderBlockResult,
} from "./orderBlockEngine";

import {
  analyzeFairValueGaps,
  type FairValueGapResult,
} from "@/lib/atlas/fairValueGapEngine";

import {
  calculateAtlasIndicators,
  type AtlasIndicatorResult,
} from "@/lib/atlas/atlasIndicators";

import {
  makeAtlasDecision,
  type AtlasDecisionEngineResult,
} from "@/lib/atlas/aiDecisionEngine";

import {
  applyRegimeGate,
  getRegimeGateConfig,
  readRegime,
} from "@/lib/atlas/regimeGate";

import { isTwelveDataSymbol } from "@/lib/services/twelveDataService";
import {
  detectBreakout,
  type BreakoutResult,
} from "@/lib/atlas/breakoutEngine";

import {
  buildTradeChecklist,
  type TradeChecklist,
} from "@/lib/atlas/tradeChecklist";

import {
  applyMacroBlackout,
  getMacroBlackoutConfig,
  readMacroBlackout,
} from "@/lib/atlas/macroBlackout";

import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

import {
  analyzeLiquidity,
  type LiquidityResult,
} from "@/lib/atlas/liquidityEngine";
import {
  analyzeVolume,
  type VolumeAnalysisResult,
} from "@/lib/atlas/volumeEngine";
import {
  analyzeVwap,
  type VwapResult,
} from "@/lib/atlas/vwapEngine";
import {
  analyzePremiumDiscount,
  type PremiumDiscountResult,
} from "@/lib/atlas/premiumDiscountEngine";
import {
  analyzeSession,
  type SessionResult,
} from "@/lib/atlas/sessionEngine";
import {
  analyzeFibonacci,
  type FibonacciResult,
} from "@/lib/atlas/fibonacciEngine";
import {
  analyzeAdx,
  type AdxResult,
} from "@/lib/atlas/adxEngine";
import {
  analyzeVolumeProfile,
  type VolumeProfileResult,
} from "@/lib/atlas/volumeProfileEngine";
import {
  analyzeRsiDivergence,
  type RsiDivergenceResult,
} from "@/lib/atlas/rsiDivergenceEngine";
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
import { fetchMarketCandles } from "@/lib/services/marketCandles";

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
fairValueGaps: FairValueGapResult;
vwap: VwapResult;
premiumDiscount: PremiumDiscountResult;
session: SessionResult;
fibonacci: FibonacciResult;
adx: AdxResult;
volumeProfile: VolumeProfileResult;
rsiDivergence: RsiDivergenceResult;
};

export type AtlasAnalysisResponse = {
  signal: AtlasTradeDirection;
  confidence: number;

  orderBlocks: OrderBlockResult;
  fairValueGaps: FairValueGapResult;

  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;

  // Latest traded price (last candle close), set regardless of signal — unlike
  // `entry`, which the engine only fills for directional LONG/SHORT calls.
  currentPrice: number;

  // Momentum/breakout detector, independent of the conservative decision.signal.
  breakout: BreakoutResult;

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
vwap: VwapResult;
premiumDiscount: PremiumDiscountResult;
fibonacci: FibonacciResult;
adx: AdxResult;
volumeProfile: VolumeProfileResult;

  risk: AtlasRiskEngineResult;
  decision: AtlasDecisionEngineResult;

  tradeSetup: ReturnType<
    typeof createTradeSetup
  >;

  checklist: TradeChecklist;
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

export function buildTimeframeSnapshot(
  interval: BinanceInterval,
  candles: BinanceCandles
): AtlasTimeframeSnapshot {
  if (candles.length < 50) {
    throw new Error(
      `Not enough candle data to analyze ${interval}.`
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

const fairValueGaps =
  analyzeFairValueGaps(candles);

const vwap = analyzeVwap(candles);

const premiumDiscount =
  analyzePremiumDiscount(candles);

const session = analyzeSession();

const fibonacci = analyzeFibonacci(candles);

const adx = analyzeAdx(candles);

const volumeProfile =
  analyzeVolumeProfile(candles);

const rsiDivergence =
  analyzeRsiDivergence(candles);

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
  fairValueGaps,
  vwap,
  premiumDiscount,
  session,
  fibonacci,
  adx,
  volumeProfile,
  rsiDivergence,
};
}

async function createTimeframeSnapshot(
  symbol: MarketSymbol,
  interval: BinanceInterval
): Promise<AtlasTimeframeSnapshot> {
  const candles =
    await fetchMarketCandles(
      symbol,
      interval,
      250
    );

  return buildTimeframeSnapshot(
    interval,
    candles
  );
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

export function computeAtlasAnalysis(
  snapshots: Map<
    BinanceInterval,
    AtlasTimeframeSnapshot
  >,
  interval: BinanceInterval = "1h",
  symbol = ""
): AtlasAnalysisResponse {
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

  const breakout = detectBreakout(
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

const rawDecision =
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

    orderBlocks:
      requestedSnapshot.orderBlocks,

    fairValueGaps:
      requestedSnapshot.fairValueGaps,

    vwap:
      requestedSnapshot.vwap,

    premiumDiscount:
      requestedSnapshot.premiumDiscount,

    session:
      requestedSnapshot.session,

    fibonacci:
      requestedSnapshot.fibonacci,

    adx:
      requestedSnapshot.adx,

    volumeProfile:
      requestedSnapshot.volumeProfile,

    rsiDivergence:
      requestedSnapshot.rsiDivergence,

    risk,
  });

  // Two guards, each of which downgrades a directional call to WAIT:
  //  1. Regime gate — don't fight the higher-timeframe trend or trade chop.
  //  2. Macro blackout — stand aside around high-impact events (FOMC/CPI/NFP).
  const toWait = (
    base: AtlasDecisionEngineResult,
    reason: AtlasReasonCode
  ): AtlasDecisionEngineResult => ({
    ...base,
    signal: "WAIT",
    entry: null,
    stopLoss: null,
    takeProfit: null,
    riskRewardRatio: null,
    explanation: reason,
    warnings: [...base.warnings, reason],
  });

  const regimeGate = applyRegimeGate(
    rawDecision.signal,
    readRegime(multiTimeframe),
    getRegimeGateConfig(
      isTwelveDataSymbol(symbol) ? "other" : "crypto"
    )
  );

  const afterRegime =
    regimeGate.gated && regimeGate.reason
      ? toWait(rawDecision, regimeGate.reason)
      : rawDecision;

  const macroConfig = getMacroBlackoutConfig();
  const macroGate = applyMacroBlackout(
    afterRegime.signal,
    readMacroBlackout(macroConfig),
    macroConfig
  );

  const decision: AtlasDecisionEngineResult =
    macroGate.gated && macroGate.reason
      ? toWait(afterRegime, macroGate.reason)
      : afterRegime;

  const checklist = buildTradeChecklist({
    signal: decision.signal,
    multiTimeframe,
    priceAction: requestedSnapshot.priceAction,
    liquidity: requestedSnapshot.liquidity,
    rawRsi: requestedSnapshot.indicators.rawRsi,
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
          fairValueGaps:
  requestedSnapshot.fairValueGaps,
    });

  return {
    orderBlocks:
  requestedSnapshot.orderBlocks,

  fairValueGaps:
  requestedSnapshot.fairValueGaps,

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

    currentPrice,

    breakout,

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

vwap:
  requestedSnapshot.vwap,

premiumDiscount:
  requestedSnapshot.premiumDiscount,

fibonacci:
  requestedSnapshot.fibonacci,

adx:
  requestedSnapshot.adx,

volumeProfile:
  requestedSnapshot.volumeProfile,

risk,
decision,

tradeSetup,
checklist,
  };
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

  return computeAtlasAnalysis(
    snapshots,
    interval,
    symbol
  );
}