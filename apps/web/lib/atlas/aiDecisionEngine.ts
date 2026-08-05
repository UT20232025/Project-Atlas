import type {
  AtlasMtfResult,
} from "@/lib/atlas/multiTimeframeEngine";

import type {
  PriceActionResult,
} from "@/lib/atlas/priceActionEngine";

import type {
  LiquidityResult,
} from "@/lib/atlas/liquidityEngine";
import type {
  VolumeAnalysisResult,
} from "@/lib/atlas/volumeEngine";

import type {
  MarketStructureResult,
} from "@/lib/atlas/marketStructureEngine";

import type {
  OrderBlockResult,
} from "@/lib/atlas/orderBlockEngine";

import type {
  FairValueGapResult,
} from "@/lib/atlas/fairValueGapEngine";

import type {
  AtlasRiskEngineResult,
  AtlasTradeDirection,
} from "@/lib/atlas/riskEngine";

import type {
  TrendEngineResult,
} from "@/lib/atlas/trendEngine";

import type {
  VwapResult,
} from "@/lib/atlas/vwapEngine";

import type {
  PremiumDiscountResult,
} from "@/lib/atlas/premiumDiscountEngine";

import type {
  SessionResult,
} from "@/lib/atlas/sessionEngine";

import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

export type AtlasDecisionStrength =
  | "STRONG"
  | "MODERATE"
  | "WEAK"
  | "NONE";

export type AtlasDecisionEngineInput = {
 proposedSignal: AtlasTradeDirection;

trend: TrendEngineResult;
multiTimeframe: AtlasMtfResult;
priceAction: PriceActionResult;
liquidity: LiquidityResult;
volume: VolumeAnalysisResult;
marketStructure: MarketStructureResult;
orderBlocks: OrderBlockResult;
fairValueGaps: FairValueGapResult;
vwap: VwapResult;
premiumDiscount: PremiumDiscountResult;
session: SessionResult;
risk: AtlasRiskEngineResult;

minimumConfidence?: number;
};

export type AtlasDecisionEngineResult = {
  signal: AtlasTradeDirection;

  tradeApproved: boolean;
  strength: AtlasDecisionStrength;

  confidence: number;
  score: number;

  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;

  bullishScore: number;
  bearishScore: number;

  reasons: AtlasReasonCode[];
  warnings: AtlasReasonCode[];

  explanation: AtlasReasonCode;
};

type DirectionScore = {
  bullishScore: number;
  bearishScore: number;
  bullishReasons: AtlasReasonCode[];
  bearishReasons: AtlasReasonCode[];
  warnings: AtlasReasonCode[];
};

const DEFAULT_MINIMUM_CONFIDENCE = 65;

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}

function calculateDirectionScore(
  input: AtlasDecisionEngineInput
): DirectionScore {
  let bullishScore = 0;
  let bearishScore = 0;

  const bullishReasons: AtlasReasonCode[] = [];
  const bearishReasons: AtlasReasonCode[] = [];
  const warnings: AtlasReasonCode[] = [];

  if (
    input.trend.direction === "BULLISH"
  ) {
    bullishScore += 22;

    bullishReasons.push({ code: "TREND_BULLISH_CONFIRMED" });
  } else if (
    input.trend.direction === "BEARISH"
  ) {
    bearishScore += 22;

    bearishReasons.push({ code: "TREND_BEARISH_CONFIRMED" });
  } else {
    warnings.push({ code: "TREND_NO_CLEAR_DIRECTION" });
  }

  if (
    input.trend.confidence >= 80
  ) {
    if (
      input.trend.direction ===
      "BULLISH"
    ) {
      bullishScore += 6;

      bullishReasons.push({ code: "TREND_BULLISH_CONFIDENCE_STRONG" });
    }

    if (
      input.trend.direction ===
      "BEARISH"
    ) {
      bearishScore += 6;

      bearishReasons.push({ code: "TREND_BEARISH_CONFIDENCE_STRONG" });
    }
  }

  if (
    input.multiTimeframe.signal ===
    "LONG"
  ) {
    bullishScore += 24;

    bullishReasons.push({ code: "MTF_SUPPORTS_LONG" });
  } else if (
    input.multiTimeframe.signal ===
    "SHORT"
  ) {
    bearishScore += 24;

    bearishReasons.push({ code: "MTF_SUPPORTS_SHORT" });
  } else {
    warnings.push({ code: "MTF_NEUTRAL" });
  }

  if (
    input.multiTimeframe.aligned
  ) {
    if (
      input.multiTimeframe.signal ===
      "LONG"
    ) {
      bullishScore += 8;

      bullishReasons.push({ code: "MTF_BULLISH_ALIGNED" });
    }

    if (
      input.multiTimeframe.signal ===
      "SHORT"
    ) {
      bearishScore += 8;

      bearishReasons.push({ code: "MTF_BEARISH_ALIGNED" });
    }
  } else {
    warnings.push({ code: "MTF_NOT_ALIGNED" });
  }

  if (
    input.priceAction.structure ===
    "BULLISH"
  ) {
    bullishScore += 16;

    bullishReasons.push({ code: "PRICE_ACTION_BULLISH_STRUCTURE" });
  } else if (
    input.priceAction.structure ===
    "BEARISH"
  ) {
    bearishScore += 16;

    bearishReasons.push({ code: "PRICE_ACTION_BEARISH_STRUCTURE" });
  } else {
    warnings.push({ code: "PRICE_ACTION_RANGING" });
  }

  if (
    input.priceAction.bullishBos
  ) {
    bullishScore += 14;

    bullishReasons.push({ code: "PRICE_ACTION_BULLISH_BOS" });
  }

  if (
    input.priceAction.bearishBos
  ) {
    bearishScore += 14;

    bearishReasons.push({ code: "PRICE_ACTION_BEARISH_BOS" });
  }

  if (
    input.priceAction.bullishChoch
  ) {
    bullishScore += 12;

    bullishReasons.push({ code: "PRICE_ACTION_BULLISH_CHOCH" });
  }

  if (
    input.priceAction.bearishChoch
  ) {
    bearishScore += 12;

    bearishReasons.push({ code: "PRICE_ACTION_BEARISH_CHOCH" });
  }

  if (
    input.liquidity.bullishSweep
  ) {
    bullishScore += 14;

    bullishReasons.push({ code: "LIQUIDITY_BULLISH_SWEEP" });
  }

  if (
    input.liquidity.bearishSweep
  ) {
    bearishScore += 14;

    bearishReasons.push({ code: "LIQUIDITY_BEARISH_SWEEP" });
  }

  if (
    input.liquidity.bullishSweep &&
    input.liquidity.bearishSweep
  ) {
    warnings.push({ code: "LIQUIDITY_BOTH_SWEEPS" });
  }
// ----- Volume Analysis -----

if (
  input.volume.pressure === "BULLISH"
) {
  bullishScore += 10;

  bullishReasons.push({ code: "VOLUME_BULLISH_PRESSURE" });
}

if (
  input.volume.pressure === "BEARISH"
) {
  bearishScore += 10;

  bearishReasons.push({ code: "VOLUME_BEARISH_PRESSURE" });
}

if (
  input.volume.confirmation === "CONFIRMED"
) {
  if (
    input.volume.pressure === "BULLISH"
  ) {
    bullishScore += 8;
  }

  if (
    input.volume.pressure === "BEARISH"
  ) {
    bearishScore += 8;
  }
}

if (
  input.volume.spike
) {
  if (
    input.volume.pressure === "BULLISH"
  ) {
    bullishScore += 5;
  }

  if (
    input.volume.pressure === "BEARISH"
  ) {
    bearishScore += 5;
  }
}

// ----- Market Structure -----

if (
  input.marketStructure.trend === "BULLISH"
) {
  bullishScore += 12;

  bullishReasons.push({ code: "MARKET_STRUCTURE_BULLISH" });
}

if (
  input.marketStructure.trend === "BEARISH"
) {
  bearishScore += 12;

  bearishReasons.push({ code: "MARKET_STRUCTURE_BEARISH" });
}

if (
  input.marketStructure.event ===
  "BOS_BULLISH"
) {
  bullishScore += 10;
}

if (
  input.marketStructure.event ===
  "BOS_BEARISH"
) {
  bearishScore += 10;
}

if (
  input.marketStructure.event ===
  "CHOCH_BULLISH"
) {
  bullishScore += 6;
}

if (
  input.marketStructure.event ===
  "CHOCH_BEARISH"
) {
  bearishScore += 6;
}

// ----- Order Blocks -----

if (
  input.orderBlocks.nearestBullishOrderBlock
) {
  bullishScore += Math.round(
    (input.orderBlocks.nearestBullishOrderBlock
      .strength /
      100) *
      10
  );

  bullishReasons.push({ code: "ORDER_BLOCK_BULLISH_SUPPORT" });
}

if (
  input.orderBlocks.nearestBearishOrderBlock
) {
  bearishScore += Math.round(
    (input.orderBlocks.nearestBearishOrderBlock
      .strength /
      100) *
      10
  );

  bearishReasons.push({ code: "ORDER_BLOCK_BEARISH_RESISTANCE" });
}

// ----- Fair Value Gaps -----

if (
  input.fairValueGaps.nearestBullishFairValueGap
) {
  bullishScore += Math.round(
    (input.fairValueGaps.nearestBullishFairValueGap
      .strength /
      100) *
      8
  );

  bullishReasons.push({ code: "FVG_BULLISH_CONTINUATION" });
}

if (
  input.fairValueGaps.nearestBearishFairValueGap
) {
  bearishScore += Math.round(
    (input.fairValueGaps.nearestBearishFairValueGap
      .strength /
      100) *
      8
  );

  bearishReasons.push({ code: "FVG_BEARISH_CONTINUATION" });
}

// ----- VWAP -----

if (
  input.vwap.bias === "BULLISH"
) {
  bullishScore += 8;

  bullishReasons.push({ code: "VWAP_PRICE_ABOVE" });
}

if (
  input.vwap.bias === "BEARISH"
) {
  bearishScore += 8;

  bearishReasons.push({ code: "VWAP_PRICE_BELOW" });
}

// ----- Premium / Discount -----

if (
  input.premiumDiscount.zone === "DISCOUNT"
) {
  bullishScore += 8;

  bullishReasons.push({ code: "PREMIUM_DISCOUNT_DISCOUNT" });
}

if (
  input.premiumDiscount.zone === "PREMIUM"
) {
  bearishScore += 8;

  bearishReasons.push({ code: "PREMIUM_DISCOUNT_PREMIUM" });
}

// ----- Session (killzone timing) -----
// Non-directional: reinforces whichever side leads and surfaces as a
// timing-quality reason regardless of the final direction.

if (
  input.session.zone === "LONDON_KILLZONE"
) {
  bullishScore += 4;
  bearishScore += 4;

  bullishReasons.push({ code: "SESSION_LONDON_KILLZONE" });
  bearishReasons.push({ code: "SESSION_LONDON_KILLZONE" });
}

if (
  input.session.zone === "NEW_YORK_KILLZONE"
) {
  bullishScore += 4;
  bearishScore += 4;

  bullishReasons.push({ code: "SESSION_NY_KILLZONE" });
  bearishReasons.push({ code: "SESSION_NY_KILLZONE" });
}

  if (
    input.priceAction.bullishBos &&
    input.priceAction.bearishChoch
  ) {
    bullishScore -= 10;
    bearishScore += 5;

    warnings.push({ code: "BOS_CHOCH_BULLISH_CONFLICT" });
  }

  if (
    input.priceAction.bearishBos &&
    input.priceAction.bullishChoch
  ) {
    bearishScore -= 10;
    bullishScore += 5;

    warnings.push({ code: "BOS_CHOCH_BEARISH_CONFLICT" });
  }

  return {
    bullishScore: Math.round(
      clamp(bullishScore, 0, 100)
    ),

    bearishScore: Math.round(
      clamp(bearishScore, 0, 100)
    ),

    bullishReasons,
    bearishReasons,
    warnings,
  };
}

function determineRawSignal(
  bullishScore: number,
  bearishScore: number
): AtlasTradeDirection {
  const difference =
    bullishScore - bearishScore;

  if (
    bullishScore >= 55 &&
    difference >= 15
  ) {
    return "LONG";
  }

  if (
    bearishScore >= 55 &&
    difference <= -15
  ) {
    return "SHORT";
  }

  return "WAIT";
}

function calculateDecisionConfidence(
  signal: AtlasTradeDirection,
  bullishScore: number,
  bearishScore: number,
  input: AtlasDecisionEngineInput
): number {
  if (signal === "WAIT") {
    const conflictScore =
      100 -
      Math.abs(
        bullishScore -
          bearishScore
      );

    const strongestDirection =
      Math.max(
        bullishScore,
        bearishScore
      );

    return Math.round(
      clamp(
        conflictScore * 0.6 +
          (100 - strongestDirection) *
            0.4,
        0,
        100
      )
    );
  }

  const selectedScore =
    signal === "LONG"
      ? bullishScore
      : bearishScore;

  const opposingScore =
    signal === "LONG"
      ? bearishScore
      : bullishScore;

  const scoreDifference =
    selectedScore - opposingScore;

  let confidence =
    selectedScore * 0.65 +
    clamp(
      scoreDifference,
      0,
      100
    ) *
      0.2 +
    input.risk.confidence * 0.15;

  if (
    input.risk.validTrade
  ) {
    confidence += 5;
  }

  if (
    input.multiTimeframe.aligned
  ) {
    confidence += 3;
  }

  return Math.round(
    clamp(confidence, 0, 100)
  );
}

function determineStrength(
  signal: AtlasTradeDirection,
  confidence: number
): AtlasDecisionStrength {
  if (signal === "WAIT") {
    return "NONE";
  }

  if (confidence >= 85) {
    return "STRONG";
  }

  if (confidence >= 70) {
    return "MODERATE";
  }

  return "WEAK";
}

function buildWaitExplanation(
  warnings: AtlasReasonCode[]
): AtlasReasonCode {
  if (warnings.length === 0) {
    return { code: "WAIT_NO_CONFIRMATION" };
  }

  return { code: "WAIT_MIXED_SIGNALS" };
}

export function makeAtlasDecision(
  input: AtlasDecisionEngineInput
): AtlasDecisionEngineResult {
  const minimumConfidence =
    input.minimumConfidence ??
    DEFAULT_MINIMUM_CONFIDENCE;

  const directionScore =
    calculateDirectionScore(input);

  const calculatedSignal =
    determineRawSignal(
      directionScore.bullishScore,
      directionScore.bearishScore
    );

  const warnings = [
    ...directionScore.warnings,
    ...input.risk.warnings,
  ];

  let signal =
    calculatedSignal;

  if (
    input.proposedSignal ===
      "WAIT" &&
    calculatedSignal !== "WAIT"
  ) {
    warnings.push({ code: "UPSTREAM_SIGNAL_WAIT_BLOCKS_DIRECTIONAL" });

    signal = "WAIT";
  }

  if (
    input.proposedSignal !==
      "WAIT" &&
    calculatedSignal !==
      "WAIT" &&
    input.proposedSignal !==
      calculatedSignal
  ) {
    warnings.push({ code: "PROPOSED_SIGNAL_CONFLICT" });

    signal = "WAIT";
  }

  if (
    signal !== "WAIT" &&
    input.risk.direction !== signal
  ) {
    warnings.push({ code: "RISK_DIRECTION_MISMATCH" });

    signal = "WAIT";
  }

  if (
    signal !== "WAIT" &&
    !input.risk.validTrade
  ) {
    warnings.push({ code: "RISK_REJECTED_SETUP" });

    signal = "WAIT";
  }

  let confidence =
    calculateDecisionConfidence(
      signal,
      directionScore.bullishScore,
      directionScore.bearishScore,
      input
    );

  if (
    signal !== "WAIT" &&
    confidence <
      minimumConfidence
  ) {
    warnings.push({
      code: "CONFIDENCE_BELOW_MINIMUM",
      params: { confidence, minimumConfidence },
    });

    signal = "WAIT";

    confidence =
      calculateDecisionConfidence(
        signal,
        directionScore.bullishScore,
        directionScore.bearishScore,
        input
      );
  }

  const tradeApproved =
    signal !== "WAIT" &&
    input.risk.validTrade &&
    confidence >=
      minimumConfidence;

  const strength =
    determineStrength(
      signal,
      confidence
    );

  const reasons =
    signal === "LONG"
      ? [
          ...directionScore.bullishReasons,
          ...input.risk.reasons,
        ]
      : signal === "SHORT"
        ? [
            ...directionScore.bearishReasons,
            ...input.risk.reasons,
          ]
        : [];

  let explanation: AtlasReasonCode;

  if (
    signal === "LONG" &&
    tradeApproved
  ) {
    explanation = {
      code: "DECISION_APPROVED_LONG",
      params: { confidence },
    };
  } else if (
    signal === "SHORT" &&
    tradeApproved
  ) {
    explanation = {
      code: "DECISION_APPROVED_SHORT",
      params: { confidence },
    };
  } else {
    explanation =
      buildWaitExplanation(warnings);
  }

  const score =
    signal === "LONG"
      ? directionScore.bullishScore
      : signal === "SHORT"
        ? directionScore.bearishScore
        : Math.max(
            directionScore.bullishScore,
            directionScore.bearishScore
          );

  return {
    signal,

    tradeApproved,
    strength,

    confidence,
    score,

    entry:
      tradeApproved
        ? input.risk.entry
        : null,

    stopLoss:
      tradeApproved
        ? input.risk.stopLoss
        : null,

    takeProfit:
      tradeApproved
        ? input.risk.takeProfit
        : null,

    riskRewardRatio:
      tradeApproved
        ? input.risk.riskRewardRatio
        : null,

    bullishScore:
      directionScore.bullishScore,

    bearishScore:
      directionScore.bearishScore,

    reasons,
    warnings,

    explanation,
  };
}
