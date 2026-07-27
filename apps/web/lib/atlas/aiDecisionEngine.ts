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
  AtlasRiskEngineResult,
  AtlasTradeDirection,
} from "@/lib/atlas/riskEngine";

import type {
  TrendEngineResult,
} from "@/lib/atlas/trendEngine";

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

  reasons: string[];
  warnings: string[];

  explanation: string;
};

type DirectionScore = {
  bullishScore: number;
  bearishScore: number;
  bullishReasons: string[];
  bearishReasons: string[];
  warnings: string[];
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

  const bullishReasons: string[] = [];
  const bearishReasons: string[] = [];
  const warnings: string[] = [];

  if (
    input.trend.direction === "BULLISH"
  ) {
    bullishScore += 22;

    bullishReasons.push(
      "Trend Engine confirms a bullish market direction."
    );
  } else if (
    input.trend.direction === "BEARISH"
  ) {
    bearishScore += 22;

    bearishReasons.push(
      "Trend Engine confirms a bearish market direction."
    );
  } else {
    warnings.push(
      "Trend Engine does not confirm a clear direction."
    );
  }

  if (
    input.trend.confidence >= 80
  ) {
    if (
      input.trend.direction ===
      "BULLISH"
    ) {
      bullishScore += 6;

      bullishReasons.push(
        "Bullish trend confidence is strong."
      );
    }

    if (
      input.trend.direction ===
      "BEARISH"
    ) {
      bearishScore += 6;

      bearishReasons.push(
        "Bearish trend confidence is strong."
      );
    }
  }

  if (
    input.multiTimeframe.signal ===
    "LONG"
  ) {
    bullishScore += 24;

    bullishReasons.push(
      "Multi-timeframe analysis supports a long position."
    );
  } else if (
    input.multiTimeframe.signal ===
    "SHORT"
  ) {
    bearishScore += 24;

    bearishReasons.push(
      "Multi-timeframe analysis supports a short position."
    );
  } else {
    warnings.push(
      "Multi-timeframe analysis is neutral."
    );
  }

  if (
    input.multiTimeframe.aligned
  ) {
    if (
      input.multiTimeframe.signal ===
      "LONG"
    ) {
      bullishScore += 8;

      bullishReasons.push(
        "Bullish timeframes are aligned."
      );
    }

    if (
      input.multiTimeframe.signal ===
      "SHORT"
    ) {
      bearishScore += 8;

      bearishReasons.push(
        "Bearish timeframes are aligned."
      );
    }
  } else {
    warnings.push(
      "The analyzed timeframes are not fully aligned."
    );
  }

  if (
    input.priceAction.structure ===
    "BULLISH"
  ) {
    bullishScore += 16;

    bullishReasons.push(
      "Price action shows higher highs and higher lows."
    );
  } else if (
    input.priceAction.structure ===
    "BEARISH"
  ) {
    bearishScore += 16;

    bearishReasons.push(
      "Price action shows lower highs and lower lows."
    );
  } else {
    warnings.push(
      "Price action is ranging or structurally mixed."
    );
  }

  if (
    input.priceAction.bullishBos
  ) {
    bullishScore += 14;

    bullishReasons.push(
      "A bullish break of structure is confirmed."
    );
  }

  if (
    input.priceAction.bearishBos
  ) {
    bearishScore += 14;

    bearishReasons.push(
      "A bearish break of structure is confirmed."
    );
  }

  if (
    input.priceAction.bullishChoch
  ) {
    bullishScore += 12;

    bullishReasons.push(
      "A bullish change of character indicates a possible bullish transition."
    );
  }

  if (
    input.priceAction.bearishChoch
  ) {
    bearishScore += 12;

    bearishReasons.push(
      "A bearish change of character indicates a possible bearish transition."
    );
  }

  if (
    input.liquidity.bullishSweep
  ) {
    bullishScore += 14;

    bullishReasons.push(
      "A bullish liquidity sweep is confirmed below liquidity."
    );
  }

  if (
    input.liquidity.bearishSweep
  ) {
    bearishScore += 14;

    bearishReasons.push(
      "A bearish liquidity sweep is confirmed above liquidity."
    );
  }

  if (
    input.liquidity.bullishSweep &&
    input.liquidity.bearishSweep
  ) {
    warnings.push(
      "Both bullish and bearish liquidity sweeps exist in the analyzed candle window."
    );
  }
// ----- Volume Analysis -----

if (
  input.volume.pressure === "BULLISH"
) {
  bullishScore += 10;

  bullishReasons.push(
    "Volume analysis confirms bullish buying pressure."
  );
}

if (
  input.volume.pressure === "BEARISH"
) {
  bearishScore += 10;

  bearishReasons.push(
    "Volume analysis confirms bearish selling pressure."
  );
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

  bullishReasons.push(
    "Market Structure Engine confirms a bullish structure."
  );
}

if (
  input.marketStructure.trend === "BEARISH"
) {
  bearishScore += 12;

  bearishReasons.push(
    "Market Structure Engine confirms a bearish structure."
  );
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

  if (
    input.priceAction.bullishBos &&
    input.priceAction.bearishChoch
  ) {
    bullishScore -= 10;
    bearishScore += 5;

    warnings.push(
      "Bullish BOS conflicts with a bearish change of character."
    );
  }

  if (
    input.priceAction.bearishBos &&
    input.priceAction.bullishChoch
  ) {
    bearishScore -= 10;
    bullishScore += 5;

    warnings.push(
      "Bearish BOS conflicts with a bullish change of character."
    );
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
  warnings: string[]
): string {
  if (warnings.length === 0) {
    return (
      "Atlas recommends WAIT because there is not enough directional confirmation " +
      "to approve a long or short trade."
    );
  }

  return (
    "Atlas recommends WAIT because the market signals are mixed, incomplete or " +
    "do not satisfy the required risk conditions."
  );
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
    warnings.push(
      "The upstream Atlas signal is WAIT, so the directional setup cannot be approved."
    );

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
    warnings.push(
      "The proposed signal conflicts with the combined Atlas analysis."
    );

    signal = "WAIT";
  }

  if (
    signal !== "WAIT" &&
    input.risk.direction !== signal
  ) {
    warnings.push(
      "Risk Engine evaluated a different trade direction than the final directional analysis."
    );

    signal = "WAIT";
  }

  if (
    signal !== "WAIT" &&
    !input.risk.validTrade
  ) {
    warnings.push(
      "Risk Engine rejected the proposed setup."
    );

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
    warnings.push(
      `Decision confidence of ${confidence}% is below the required ${minimumConfidence}%.`
    );

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

  let explanation: string;

  if (
    signal === "LONG" &&
    tradeApproved
  ) {
    explanation =
      `Atlas approved a LONG trade with ${confidence}% confidence. ` +
      "Bullish trend, market structure, multi-timeframe confirmation and risk conditions support the setup.";
  } else if (
    signal === "SHORT" &&
    tradeApproved
  ) {
    explanation =
      `Atlas approved a SHORT trade with ${confidence}% confidence. ` +
      "Bearish trend, market structure, multi-timeframe confirmation and risk conditions support the setup.";
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