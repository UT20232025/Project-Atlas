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
  TrendEngineResult,
} from "@/lib/atlas/trendEngine";

import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

export type AtlasTradeDirection =
  | "LONG"
  | "SHORT"
  | "WAIT";

export type AtlasRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "INVALID";

export type AtlasTradeLevels = {
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskAmount: number | null;
  rewardAmount: number | null;
  riskRewardRatio: number | null;
};

export type AtlasRiskEngineInput = {
  signal: AtlasTradeDirection;

  currentPrice: number;
  atr: number | null;

  trend: TrendEngineResult;
  multiTimeframe: AtlasMtfResult;
  priceAction: PriceActionResult;
  liquidity: LiquidityResult;

  minimumRiskReward?: number;
  atrStopMultiplier?: number;
  atrTargetMultiplier?: number;
};

export type AtlasRiskEngineResult = {
  direction: AtlasTradeDirection;

  validTrade: boolean;
  riskLevel: AtlasRiskLevel;

  levels: AtlasTradeLevels;

  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;

  confidence: number;

  reasons: AtlasReasonCode[];
  warnings: AtlasReasonCode[];

  explanation: AtlasReasonCode;
};

type DirectionalValidation = {
  score: number;
  reasons: AtlasReasonCode[];
  warnings: AtlasReasonCode[];
};

const DEFAULT_MINIMUM_RISK_REWARD = 2;
const DEFAULT_ATR_STOP_MULTIPLIER = 1.5;
const DEFAULT_ATR_TARGET_MULTIPLIER = 3;

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

function roundPrice(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (Math.abs(value) >= 1000) {
    return Number(value.toFixed(2));
  }

  if (Math.abs(value) >= 1) {
    return Number(value.toFixed(4));
  }

  return Number(value.toFixed(8));
}

function roundRatio(
  value: number
): number {
  return Number(value.toFixed(2));
}

function createEmptyLevels(): AtlasTradeLevels {
  return {
    entry: null,
    stopLoss: null,
    takeProfit: null,
    riskAmount: null,
    rewardAmount: null,
    riskRewardRatio: null,
  };
}

function validateInput(
  input: AtlasRiskEngineInput
): AtlasReasonCode[] {
  const warnings: AtlasReasonCode[] = [];

  if (
    !Number.isFinite(input.currentPrice) ||
    input.currentPrice <= 0
  ) {
    warnings.push({ code: "RISK_VALIDATE_PRICE" });
  }

  if (
    input.atr === null ||
    !Number.isFinite(input.atr) ||
    input.atr <= 0
  ) {
    warnings.push({ code: "RISK_VALIDATE_ATR" });
  }

  return warnings;
}

function validateLongDirection(
  input: AtlasRiskEngineInput
): DirectionalValidation {
  let score = 0;

  const reasons: AtlasReasonCode[] = [];
  const warnings: AtlasReasonCode[] = [];

  if (
    input.trend.direction === "BULLISH"
  ) {
    score += 20;

    reasons.push({ code: "RISK_LONG_TREND_BULLISH" });
  } else if (
    input.trend.direction === "BEARISH"
  ) {
    score -= 25;

    warnings.push({ code: "RISK_LONG_TREND_BEARISH_CONFLICT" });
  } else {
    warnings.push({ code: "RISK_LONG_TREND_UNCLEAR" });
  }

  if (
    input.multiTimeframe.signal === "LONG"
  ) {
    score += 20;

    reasons.push({ code: "RISK_LONG_MTF_SUPPORTS" });
  } else if (
    input.multiTimeframe.signal === "SHORT"
  ) {
    score -= 25;

    warnings.push({ code: "RISK_LONG_MTF_CONFLICT" });
  } else {
    warnings.push({ code: "RISK_MTF_NEUTRAL" });
  }

  if (
    input.multiTimeframe.aligned
  ) {
    score += 10;

    reasons.push({ code: "RISK_TIMEFRAMES_ALIGNED" });
  }

  if (
    input.priceAction.structure ===
    "BULLISH"
  ) {
    score += 15;

    reasons.push({ code: "RISK_LONG_PRICE_ACTION_BULLISH" });
  } else if (
    input.priceAction.structure ===
    "BEARISH"
  ) {
    score -= 20;

    warnings.push({ code: "RISK_LONG_PRICE_ACTION_BEARISH_CONFLICT" });
  }

  if (
    input.priceAction.bullishBos
  ) {
    score += 15;

    reasons.push({ code: "PRICE_ACTION_BULLISH_BOS" });
  }

  if (
    input.priceAction.bullishChoch
  ) {
    score += 12;

    reasons.push({ code: "RISK_LONG_BULLISH_CHOCH_CONFIRMED" });
  }

  if (
    input.priceAction.bearishChoch
  ) {
    score -= 20;

    warnings.push({ code: "RISK_LONG_BEARISH_CHOCH_CONFLICT" });
  }

  if (
    input.liquidity.bullishSweep
  ) {
    score += 15;

    reasons.push({ code: "RISK_LONG_BULLISH_SWEEP_SUPPORTS" });
  }

  if (
    input.liquidity.bearishSweep
  ) {
    score -= 12;

    warnings.push({ code: "RISK_LONG_BEARISH_SWEEP_WEAKENS" });
  }

  return {
    score,
    reasons,
    warnings,
  };
}

function validateShortDirection(
  input: AtlasRiskEngineInput
): DirectionalValidation {
  let score = 0;

  const reasons: AtlasReasonCode[] = [];
  const warnings: AtlasReasonCode[] = [];

  if (
    input.trend.direction === "BEARISH"
  ) {
    score += 20;

    reasons.push({ code: "RISK_SHORT_TREND_BEARISH" });
  } else if (
    input.trend.direction === "BULLISH"
  ) {
    score -= 25;

    warnings.push({ code: "RISK_SHORT_TREND_BULLISH_CONFLICT" });
  } else {
    warnings.push({ code: "RISK_SHORT_TREND_UNCLEAR" });
  }

  if (
    input.multiTimeframe.signal === "SHORT"
  ) {
    score += 20;

    reasons.push({ code: "RISK_SHORT_MTF_SUPPORTS" });
  } else if (
    input.multiTimeframe.signal === "LONG"
  ) {
    score -= 25;

    warnings.push({ code: "RISK_SHORT_MTF_CONFLICT" });
  } else {
    warnings.push({ code: "RISK_MTF_NEUTRAL" });
  }

  if (
    input.multiTimeframe.aligned
  ) {
    score += 10;

    reasons.push({ code: "RISK_TIMEFRAMES_ALIGNED" });
  }

  if (
    input.priceAction.structure ===
    "BEARISH"
  ) {
    score += 15;

    reasons.push({ code: "RISK_SHORT_PRICE_ACTION_BEARISH" });
  } else if (
    input.priceAction.structure ===
    "BULLISH"
  ) {
    score -= 20;

    warnings.push({ code: "RISK_SHORT_PRICE_ACTION_BULLISH_CONFLICT" });
  }

  if (
    input.priceAction.bearishBos
  ) {
    score += 15;

    reasons.push({ code: "PRICE_ACTION_BEARISH_BOS" });
  }

  if (
    input.priceAction.bearishChoch
  ) {
    score += 12;

    reasons.push({ code: "RISK_SHORT_BEARISH_CHOCH_CONFIRMED" });
  }

  if (
    input.priceAction.bullishChoch
  ) {
    score -= 20;

    warnings.push({ code: "RISK_SHORT_BULLISH_CHOCH_CONFLICT" });
  }

  if (
    input.liquidity.bearishSweep
  ) {
    score += 15;

    reasons.push({ code: "RISK_SHORT_BEARISH_SWEEP_SUPPORTS" });
  }

  if (
    input.liquidity.bullishSweep
  ) {
    score -= 12;

    warnings.push({ code: "RISK_SHORT_BULLISH_SWEEP_WEAKENS" });
  }

  return {
    score,
    reasons,
    warnings,
  };
}

function calculateLongLevels(
  input: AtlasRiskEngineInput,
  atr: number,
  stopMultiplier: number,
  targetMultiplier: number
): AtlasTradeLevels {
  const entry = input.currentPrice;

  const atrStop =
    entry - atr * stopMultiplier;

  const structuralStop =
    input.priceAction.lastLow?.price ??
    null;

  const liquidityStop =
    input.liquidity.liquidityBelow !==
    null
      ? input.liquidity.liquidityBelow -
        atr * 0.2
      : null;

  const stopCandidates = [
    atrStop,
    structuralStop,
    liquidityStop,
  ].filter(
    (value): value is number =>
      value !== null &&
      Number.isFinite(value) &&
      value > 0 &&
      value < entry
  );

  const stopLoss =
    stopCandidates.length > 0
      ? Math.min(...stopCandidates)
      : atrStop;

  const riskAmount =
    entry - stopLoss;

  const atrTarget =
    entry + atr * targetMultiplier;

  const structureTarget =
    input.priceAction.lastHigh?.price ??
    null;

  const liquidityTarget =
    input.liquidity.liquidityAbove;

  const targetCandidates = [
    atrTarget,
    structureTarget,
    liquidityTarget,
  ].filter(
    (value): value is number =>
      value !== null &&
      Number.isFinite(value) &&
      value > entry
  );

  const takeProfit =
    targetCandidates.length > 0
      ? Math.max(...targetCandidates)
      : atrTarget;

  const rewardAmount =
    takeProfit - entry;

  const riskRewardRatio =
    riskAmount > 0
      ? rewardAmount / riskAmount
      : 0;

  return {
    entry: roundPrice(entry),
    stopLoss: roundPrice(stopLoss),
    takeProfit:
      roundPrice(takeProfit),
    riskAmount:
      roundPrice(riskAmount),
    rewardAmount:
      roundPrice(rewardAmount),
    riskRewardRatio:
      roundRatio(riskRewardRatio),
  };
}

function calculateShortLevels(
  input: AtlasRiskEngineInput,
  atr: number,
  stopMultiplier: number,
  targetMultiplier: number
): AtlasTradeLevels {
  const entry = input.currentPrice;

  const atrStop =
    entry + atr * stopMultiplier;

  const structuralStop =
    input.priceAction.lastHigh?.price ??
    null;

  const liquidityStop =
    input.liquidity.liquidityAbove !==
    null
      ? input.liquidity.liquidityAbove +
        atr * 0.2
      : null;

  const stopCandidates = [
    atrStop,
    structuralStop,
    liquidityStop,
  ].filter(
    (value): value is number =>
      value !== null &&
      Number.isFinite(value) &&
      value > entry
  );

  const stopLoss =
    stopCandidates.length > 0
      ? Math.max(...stopCandidates)
      : atrStop;

  const riskAmount =
    stopLoss - entry;

  const atrTarget =
    entry - atr * targetMultiplier;

  const structureTarget =
    input.priceAction.lastLow?.price ??
    null;

  const liquidityTarget =
    input.liquidity.liquidityBelow;

  const targetCandidates = [
    atrTarget,
    structureTarget,
    liquidityTarget,
  ].filter(
    (value): value is number =>
      value !== null &&
      Number.isFinite(value) &&
      value > 0 &&
      value < entry
  );

  const takeProfit =
    targetCandidates.length > 0
      ? Math.min(...targetCandidates)
      : atrTarget;

  const rewardAmount =
    entry - takeProfit;

  const riskRewardRatio =
    riskAmount > 0
      ? rewardAmount / riskAmount
      : 0;

  return {
    entry: roundPrice(entry),
    stopLoss: roundPrice(stopLoss),
    takeProfit:
      roundPrice(takeProfit),
    riskAmount:
      roundPrice(riskAmount),
    rewardAmount:
      roundPrice(rewardAmount),
    riskRewardRatio:
      roundRatio(riskRewardRatio),
  };
}

function determineRiskLevel(
  validTrade: boolean,
  confidence: number,
  riskRewardRatio: number
): AtlasRiskLevel {
  if (!validTrade) {
    return "INVALID";
  }

  if (
    confidence >= 80 &&
    riskRewardRatio >= 3
  ) {
    return "LOW";
  }

  if (
    confidence >= 60 &&
    riskRewardRatio >= 2
  ) {
    return "MEDIUM";
  }

  return "HIGH";
}

export function analyzeRisk(
  input: AtlasRiskEngineInput
): AtlasRiskEngineResult {
  const inputWarnings =
    validateInput(input);

  if (input.signal === "WAIT") {
    return {
      direction: "WAIT",

      validTrade: false,
      riskLevel: "INVALID",

      levels: createEmptyLevels(),

      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskRewardRatio: null,

      confidence: 0,

      reasons: [],
      warnings: [
        ...inputWarnings,
        { code: "RISK_NO_SIGNAL" },
      ],

      explanation: { code: "RISK_REJECTED_NO_DIRECTION" },
    };
  }

  if (inputWarnings.length > 0) {
    return {
      direction: input.signal,

      validTrade: false,
      riskLevel: "INVALID",

      levels: createEmptyLevels(),

      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskRewardRatio: null,

      confidence: 0,

      reasons: [],
      warnings: inputWarnings,

      explanation: { code: "RISK_REJECTED_INVALID_DATA" },
    };
  }

  const atr = input.atr as number;

  const minimumRiskReward =
    input.minimumRiskReward ??
    DEFAULT_MINIMUM_RISK_REWARD;

  const atrStopMultiplier =
    input.atrStopMultiplier ??
    DEFAULT_ATR_STOP_MULTIPLIER;

  const atrTargetMultiplier =
    input.atrTargetMultiplier ??
    DEFAULT_ATR_TARGET_MULTIPLIER;

  const directionalValidation =
    input.signal === "LONG"
      ? validateLongDirection(input)
      : validateShortDirection(input);

  const levels =
    input.signal === "LONG"
      ? calculateLongLevels(
          input,
          atr,
          atrStopMultiplier,
          atrTargetMultiplier
        )
      : calculateShortLevels(
          input,
          atr,
          atrStopMultiplier,
          atrTargetMultiplier
        );

  const riskRewardRatio =
    levels.riskRewardRatio ?? 0;

  const reasons: AtlasReasonCode[] = [
    ...directionalValidation.reasons,
  ];

  const warnings: AtlasReasonCode[] = [
    ...directionalValidation.warnings,
  ];

  let score =
    50 + directionalValidation.score;

  if (
    riskRewardRatio >=
    minimumRiskReward
  ) {
    score += 15;

    reasons.push({
      code: "RISK_RR_MEETS_MINIMUM",
      params: { riskRewardRatio: riskRewardRatio.toFixed(2) },
    });
  } else {
    score -= 30;

    warnings.push({
      code: "RISK_RR_BELOW_MINIMUM",
      params: {
        riskRewardRatio: riskRewardRatio.toFixed(2),
        minimumRiskReward: minimumRiskReward.toFixed(2),
      },
    });
  }

  if (
    input.trend.confidence >= 75
  ) {
    score += 5;

    reasons.push({ code: "RISK_TREND_CONFIDENCE_STRONG" });
  }

  if (
    input.priceAction.confidence >= 75
  ) {
    score += 5;

    reasons.push({ code: "RISK_PRICE_ACTION_CONFIDENCE_STRONG" });
  }

  if (
    input.liquidity.confidence >= 70
  ) {
    score += 5;

    reasons.push({ code: "RISK_LIQUIDITY_CONFIDENCE_STRONG" });
  }

  const confidence = Math.round(
    clamp(score, 0, 100)
  );

  const directionalConflict =
    directionalValidation.score < 0;

  const validTrade =
    riskRewardRatio >=
      minimumRiskReward &&
    confidence >= 60 &&
    !directionalConflict;

  if (!validTrade) {
    warnings.push({ code: "RISK_SETUP_DOES_NOT_MEET_REQUIREMENTS" });
  }

  const riskLevel =
    determineRiskLevel(
      validTrade,
      confidence,
      riskRewardRatio
    );

  let explanation: AtlasReasonCode;

  if (validTrade) {
    explanation = {
      code: "RISK_SETUP_APPROVED",
      params: {
        signal: input.signal,
        riskRewardRatio: riskRewardRatio.toFixed(2),
        confidence,
      },
    };
  } else {
    explanation = {
      code: "RISK_SETUP_REJECTED",
      params: { signal: input.signal },
    };
  }

  return {
    direction: input.signal,

    validTrade,
    riskLevel,

    levels,

    entry: levels.entry,
    stopLoss: levels.stopLoss,
    takeProfit: levels.takeProfit,
    riskRewardRatio:
      levels.riskRewardRatio,

    confidence,

    reasons,
    warnings,

    explanation,
  };
}
