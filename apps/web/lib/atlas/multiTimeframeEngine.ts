import type {
  AtlasSignal,
} from "@/lib/atlas/atlasEngine";

import type {
  AtlasTrendFilterResult,
} from "@/lib/atlas/trendFilter";

import type {
  TrendEngineResult,
} from "@/lib/atlas/trendEngine";

import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

export type AtlasTimeframe =
  | "15m"
  | "1h"
  | "4h";

export type AtlasTimeframeRole =
  | "TIMING"
  | "PRIMARY"
  | "MACRO";

export type AtlasTimeframeAnalysis = {
  timeframe: AtlasTimeframe;
  role: AtlasTimeframeRole;
  trend: TrendEngineResult;
  trendFilter: AtlasTrendFilterResult;
};

export type AtlasMtfTimeframeResult = {
  timeframe: AtlasTimeframe;
  role: AtlasTimeframeRole;
  signal: AtlasSignal;
  confidence: number;
  trendDirection: TrendEngineResult["direction"];
  trendStrength: number;
  weight: number;
};

export type AtlasMtfResult = {
  signal: AtlasSignal;
  confidence: number;
  agreement: number;
  aligned: boolean;
  conflict: boolean;
  bullishScore: number;
  bearishScore: number;
  timeframeResults: AtlasMtfTimeframeResult[];
  explanation: AtlasReasonCode;
};

const TIMEFRAME_WEIGHT: Record<
  AtlasTimeframe,
  number
> = {
  "15m": 20,
  "1h": 50,
  "4h": 30,
};

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

function signalValue(
  signal: AtlasSignal
): number {
  switch (signal) {
    case "STRONG_LONG":
      return 2;

    case "LONG":
      return 1;

    case "NEUTRAL":
      return 0;

    case "SHORT":
      return -1;

    case "STRONG_SHORT":
      return -2;

    default:
      return 0;
  }
}

function isBullishSignal(
  signal: AtlasSignal
): boolean {
  return (
    signal === "LONG" ||
    signal === "STRONG_LONG"
  );
}

function isBearishSignal(
  signal: AtlasSignal
): boolean {
  return (
    signal === "SHORT" ||
    signal === "STRONG_SHORT"
  );
}

function valueToSignal(
  value: number
): AtlasSignal {
  if (value >= 1.35) {
    return "STRONG_LONG";
  }

  if (value >= 0.45) {
    return "LONG";
  }

  if (value <= -1.35) {
    return "STRONG_SHORT";
  }

  if (value <= -0.45) {
    return "SHORT";
  }

  return "NEUTRAL";
}

function getTrendMultiplier(
  trend: TrendEngineResult
): number {
  const strengthMultiplier =
    clamp(trend.strength, 0, 100) / 100;

  switch (trend.direction) {
    case "STRONG_BULLISH":
    case "STRONG_BEARISH":
      return 1 + strengthMultiplier * 0.2;

    case "BULLISH":
    case "BEARISH":
      return 0.9 + strengthMultiplier * 0.15;

    case "SIDEWAYS":
      return 0.55;

    default:
      return 1;
  }
}

function hasTrendConflict(
  signal: AtlasSignal,
  trend: TrendEngineResult
): boolean {
  const bullishSignal =
    isBullishSignal(signal);

  const bearishSignal =
    isBearishSignal(signal);

  const bullishTrend =
    trend.direction === "BULLISH" ||
    trend.direction === "STRONG_BULLISH";

  const bearishTrend =
    trend.direction === "BEARISH" ||
    trend.direction === "STRONG_BEARISH";

  return (
    (bullishSignal && bearishTrend) ||
    (bearishSignal && bullishTrend)
  );
}

function buildExplanation(
  signal: AtlasSignal,
  agreement: number,
  conflict: boolean
): AtlasReasonCode {
  if (conflict) {
    return { code: "MTF_CONFLICT" };
  }

  if (
    signal === "STRONG_LONG" &&
    agreement >= 90
  ) {
    return { code: "MTF_STRONG_BULLISH_ALIGNED" };
  }

  if (
    signal === "STRONG_SHORT" &&
    agreement >= 90
  ) {
    return { code: "MTF_STRONG_BEARISH_ALIGNED" };
  }

  if (
    signal === "LONG" &&
    agreement >= 70
  ) {
    return { code: "MTF_BULLISH_CONFIRMATION" };
  }

  if (
    signal === "SHORT" &&
    agreement >= 70
  ) {
    return { code: "MTF_BEARISH_CONFIRMATION" };
  }

  if (signal === "NEUTRAL") {
    return { code: "MTF_NO_CLEAR_DIRECTION" };
  }

  return { code: "MTF_PARTIAL_CONFIRMATION" };
}

export function analyzeMultiTimeframe(
  analyses: AtlasTimeframeAnalysis[]
): AtlasMtfResult {
  if (analyses.length === 0) {
    return {
      signal: "NEUTRAL",
      confidence: 0,
      agreement: 0,
      aligned: false,
      conflict: false,
      bullishScore: 0,
      bearishScore: 0,
      timeframeResults: [],
      explanation: { code: "MTF_NO_ANALYSES" },
    };
  }

  const timeframeResults: AtlasMtfTimeframeResult[] =
    analyses.map((item) => {
      const weight =
        TIMEFRAME_WEIGHT[item.timeframe];

      return {
        timeframe: item.timeframe,
        role: item.role,
        signal: item.trendFilter.signal,
        confidence:
          item.trendFilter.confidence,
        trendDirection:
          item.trend.direction,
        trendStrength:
          item.trend.strength,
        weight,
      };
    });

  const availableWeight =
    timeframeResults.reduce(
      (total, result) =>
        total + result.weight,
      0
    );

  let weightedSignalTotal = 0;
  let weightedConfidenceTotal = 0;

  let bullishWeight = 0;
  let bearishWeight = 0;
  let neutralWeight = 0;

  let conflictCount = 0;

  for (const item of analyses) {
    const weight =
      TIMEFRAME_WEIGHT[item.timeframe];

    const signal =
      item.trendFilter.signal;

    const baseSignalValue =
      signalValue(signal);

    const trendMultiplier =
      getTrendMultiplier(item.trend);

    const trendConflict =
      hasTrendConflict(
        signal,
        item.trend
      );

    if (trendConflict) {
      conflictCount++;
    }

    const conflictMultiplier =
      trendConflict ? 0.35 : 1;

    const confidenceMultiplier =
      clamp(
        item.trendFilter.confidence,
        0,
        100
      ) / 100;

    const weightedSignal =
      baseSignalValue *
      weight *
      trendMultiplier *
      conflictMultiplier *
      confidenceMultiplier;

    weightedSignalTotal +=
      weightedSignal;

    weightedConfidenceTotal +=
      item.trendFilter.confidence *
      weight;

    if (isBullishSignal(signal)) {
      bullishWeight += weight;
    } else if (
      isBearishSignal(signal)
    ) {
      bearishWeight += weight;
    } else {
      neutralWeight += weight;
    }
  }

  const normalizedSignal =
    availableWeight > 0
      ? weightedSignalTotal /
        availableWeight
      : 0;

  const baseConfidence =
    availableWeight > 0
      ? weightedConfidenceTotal /
        availableWeight
      : 0;

  const directionalWeight =
    bullishWeight + bearishWeight;

  const dominantWeight =
    Math.max(
      bullishWeight,
      bearishWeight
    );

  const agreement =
    directionalWeight > 0
      ? Math.round(
          (dominantWeight /
            availableWeight) *
            100
        )
      : Math.round(
          (neutralWeight /
            availableWeight) *
            100
        );

  const opposingDirections =
    bullishWeight > 0 &&
    bearishWeight > 0;

  const primaryResult =
    timeframeResults.find(
      (result) =>
        result.timeframe === "1h"
    );

  const macroResult =
    timeframeResults.find(
      (result) =>
        result.timeframe === "4h"
    );

  const primaryMacroConflict =
    primaryResult !== undefined &&
    macroResult !== undefined &&
    ((isBullishSignal(
      primaryResult.signal
    ) &&
      isBearishSignal(
        macroResult.signal
      )) ||
      (isBearishSignal(
        primaryResult.signal
      ) &&
        isBullishSignal(
          macroResult.signal
        )));

  const conflict =
    conflictCount > 0 ||
    primaryMacroConflict ||
    (opposingDirections &&
      agreement < 70);

  let signal =
    valueToSignal(normalizedSignal);

  if (conflict) {
    signal = "NEUTRAL";
  }

  if (
    agreement < 50 &&
    signal !== "NEUTRAL"
  ) {
    signal = "NEUTRAL";
  }

  const agreementMultiplier =
    agreement / 100;

  let confidence =
    Math.round(
      baseConfidence *
        agreementMultiplier
    );

  if (
    agreement >= 95 &&
    !conflict &&
    signal !== "NEUTRAL"
  ) {
    confidence += 8;
  } else if (
    agreement >= 70 &&
    !conflict &&
    signal !== "NEUTRAL"
  ) {
    confidence += 3;
  }

  if (signal === "NEUTRAL") {
    confidence = Math.min(
      confidence,
      55
    );
  }

  confidence = clamp(
    confidence,
    0,
    100
  );

  const aligned =
    !conflict &&
    agreement >= 90 &&
    signal !== "NEUTRAL";

  const bullishScore = Math.round(
    (bullishWeight /
      availableWeight) *
      100
  );

  const bearishScore = Math.round(
    (bearishWeight /
      availableWeight) *
      100
  );

  return {
    signal,
    confidence,
    agreement,
    aligned,
    conflict,
    bullishScore:
      Number.isFinite(bullishScore)
        ? bullishScore
        : 0,
    bearishScore:
      Number.isFinite(bearishScore)
        ? bearishScore
        : 0,
    timeframeResults,
    explanation: buildExplanation(
      signal,
      agreement,
      conflict
    ),
  };
}