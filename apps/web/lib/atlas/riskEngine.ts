import type {
  AtlasMtfResult,
} from "@/lib/atlas/multiTimeframe";

import type {
  PriceActionResult,
} from "@/lib/atlas/priceActionEngine";

import type {
  LiquidityResult,
} from "@/lib/atlas/liquidityEngine";

import type {
  TrendEngineResult,
} from "@/lib/atlas/trendEngine";

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

  reasons: string[];
  warnings: string[];

  explanation: string;
};

type DirectionalValidation = {
  score: number;
  reasons: string[];
  warnings: string[];
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
): string[] {
  const warnings: string[] = [];

  if (
    !Number.isFinite(input.currentPrice) ||
    input.currentPrice <= 0
  ) {
    warnings.push(
      "Current price must be greater than zero."
    );
  }

  if (
    input.atr === null ||
    !Number.isFinite(input.atr) ||
    input.atr <= 0
  ) {
    warnings.push(
      "A valid ATR value is required to calculate trade levels."
    );
  }

  return warnings;
}

function validateLongDirection(
  input: AtlasRiskEngineInput
): DirectionalValidation {
  let score = 0;

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (
    input.trend.direction === "BULLISH"
  ) {
    score += 20;

    reasons.push(
      "Trend Engine confirms a bullish trend."
    );
  } else if (
    input.trend.direction === "BEARISH"
  ) {
    score -= 25;

    warnings.push(
      "Trend Engine is bearish against the proposed long trade."
    );
  } else {
    warnings.push(
      "Trend Engine does not show a clear bullish direction."
    );
  }

  if (
    input.multiTimeframe.signal === "LONG"
  ) {
    score += 20;

    reasons.push(
      "Multi-timeframe analysis supports a long trade."
    );
  } else if (
    input.multiTimeframe.signal === "SHORT"
  ) {
    score -= 25;

    warnings.push(
      "Multi-timeframe analysis conflicts with the proposed long trade."
    );
  } else {
    warnings.push(
      "Multi-timeframe analysis is neutral."
    );
  }

  if (
    input.multiTimeframe.aligned
  ) {
    score += 10;

    reasons.push(
      "The analyzed timeframes are aligned."
    );
  }

  if (
    input.priceAction.structure ===
    "BULLISH"
  ) {
    score += 15;

    reasons.push(
      "Price action shows a bullish market structure."
    );
  } else if (
    input.priceAction.structure ===
    "BEARISH"
  ) {
    score -= 20;

    warnings.push(
      "Price action structure is bearish."
    );
  }

  if (
    input.priceAction.bullishBos
  ) {
    score += 15;

    reasons.push(
      "A bullish break of structure is confirmed."
    );
  }

  if (
    input.priceAction.bullishChoch
  ) {
    score += 12;

    reasons.push(
      "A bullish change of character is confirmed."
    );
  }

  if (
    input.priceAction.bearishChoch
  ) {
    score -= 20;

    warnings.push(
      "A bearish change of character conflicts with the long setup."
    );
  }

  if (
    input.liquidity.bullishSweep
  ) {
    score += 15;

    reasons.push(
      "A bullish liquidity sweep supports the long setup."
    );
  }

  if (
    input.liquidity.bearishSweep
  ) {
    score -= 12;

    warnings.push(
      "A bearish liquidity sweep may weaken the long setup."
    );
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

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (
    input.trend.direction === "BEARISH"
  ) {
    score += 20;

    reasons.push(
      "Trend Engine confirms a bearish trend."
    );
  } else if (
    input.trend.direction === "BULLISH"
  ) {
    score -= 25;

    warnings.push(
      "Trend Engine is bullish against the proposed short trade."
    );
  } else {
    warnings.push(
      "Trend Engine does not show a clear bearish direction."
    );
  }

  if (
    input.multiTimeframe.signal === "SHORT"
  ) {
    score += 20;

    reasons.push(
      "Multi-timeframe analysis supports a short trade."
    );
  } else if (
    input.multiTimeframe.signal === "LONG"
  ) {
    score -= 25;

    warnings.push(
      "Multi-timeframe analysis conflicts with the proposed short trade."
    );
  } else {
    warnings.push(
      "Multi-timeframe analysis is neutral."
    );
  }

  if (
    input.multiTimeframe.aligned
  ) {
    score += 10;

    reasons.push(
      "The analyzed timeframes are aligned."
    );
  }

  if (
    input.priceAction.structure ===
    "BEARISH"
  ) {
    score += 15;

    reasons.push(
      "Price action shows a bearish market structure."
    );
  } else if (
    input.priceAction.structure ===
    "BULLISH"
  ) {
    score -= 20;

    warnings.push(
      "Price action structure is bullish."
    );
  }

  if (
    input.priceAction.bearishBos
  ) {
    score += 15;

    reasons.push(
      "A bearish break of structure is confirmed."
    );
  }

  if (
    input.priceAction.bearishChoch
  ) {
    score += 12;

    reasons.push(
      "A bearish change of character is confirmed."
    );
  }

  if (
    input.priceAction.bullishChoch
  ) {
    score -= 20;

    warnings.push(
      "A bullish change of character conflicts with the short setup."
    );
  }

  if (
    input.liquidity.bearishSweep
  ) {
    score += 15;

    reasons.push(
      "A bearish liquidity sweep supports the short setup."
    );
  }

  if (
    input.liquidity.bullishSweep
  ) {
    score -= 12;

    warnings.push(
      "A bullish liquidity sweep may weaken the short setup."
    );
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
        "No trade levels were calculated because the current signal is WAIT.",
      ],

      explanation:
        "Risk Engine rejected the setup because no directional trade signal is active.",
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

      explanation:
        "Risk Engine could not calculate a valid setup because required market data is missing or invalid.",
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

  const reasons = [
    ...directionalValidation.reasons,
  ];

  const warnings = [
    ...directionalValidation.warnings,
  ];

  let score =
    50 + directionalValidation.score;

  if (
    riskRewardRatio >=
    minimumRiskReward
  ) {
    score += 15;

    reasons.push(
      `Risk/reward ratio of ${riskRewardRatio.toFixed(
        2
      )}:1 meets the minimum requirement.`
    );
  } else {
    score -= 30;

    warnings.push(
      `Risk/reward ratio of ${riskRewardRatio.toFixed(
        2
      )}:1 is below the required ${minimumRiskReward.toFixed(
        2
      )}:1.`
    );
  }

  if (
    input.trend.confidence >= 75
  ) {
    score += 5;

    reasons.push(
      "Trend confidence is strong."
    );
  }

  if (
    input.priceAction.confidence >= 75
  ) {
    score += 5;

    reasons.push(
      "Price-action confidence is strong."
    );
  }

  if (
    input.liquidity.confidence >= 70
  ) {
    score += 5;

    reasons.push(
      "Liquidity confirmation has strong confidence."
    );
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
    warnings.push(
      "The complete setup does not meet Atlas risk requirements."
    );
  }

  const riskLevel =
    determineRiskLevel(
      validTrade,
      confidence,
      riskRewardRatio
    );

  let explanation: string;

  if (validTrade) {
    explanation =
      `${input.signal} setup approved with ` +
      `${riskRewardRatio.toFixed(
        2
      )}:1 risk/reward and ` +
      `${confidence}% risk confidence.`;
  } else {
    explanation =
      `${input.signal} setup rejected because ` +
      "the directional confirmation, confidence or risk/reward requirement is insufficient.";
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