import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

export type AtlasSignal =
  | "STRONG_LONG"
  | "LONG"
  | "NEUTRAL"
  | "SHORT"
  | "STRONG_SHORT";

export type AtlasRisk = "LOW" | "MODERATE" | "HIGH";

export type AtlasFactorName =
  | "trend"
  | "rsi"
  | "macd"
  | "volume"
  | "momentum";

export type AtlasMarketInput = {
  trend: number;
  rsi: number;
  macd: number;
  volume: number;
  momentum: number;
};

export type AtlasFactorResult = {
  name: AtlasFactorName;
  label: string;
  score: number;
  maxScore: number;
  status: "BULLISH" | "NEUTRAL" | "BEARISH";
  explanation: AtlasReasonCode;
};

export type AtlasAnalysis = {
  score: number;
  signal: AtlasSignal;
  confidence: number;
  risk: AtlasRisk;
  factors: AtlasFactorResult[];
  summary: AtlasReasonCode[];
};

const FACTOR_WEIGHTS: Record<AtlasFactorName, number> = {
  trend: 30,
  rsi: 20,
  macd: 20,
  volume: 15,
  momentum: 15,
};

function clamp(
  value: number,
  minimum: number,
  maximum: number
) {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalizeIndicator(value: number) {
  return clamp(value, -1, 1);
}

function calculateFactorScore(
  normalizedValue: number,
  maxScore: number
) {
  const normalizedScore = (normalizedValue + 1) / 2;

  return Math.round(normalizedScore * maxScore);
}

function getFactorStatus(
  value: number
): AtlasFactorResult["status"] {
  if (value >= 0.25) {
    return "BULLISH";
  }

  if (value <= -0.25) {
    return "BEARISH";
  }

  return "NEUTRAL";
}

function getFactorExplanation(
  name: AtlasFactorName,
  value: number
): AtlasReasonCode {
  const status = getFactorStatus(value);

  const codes: Record<
    AtlasFactorName,
    Record<AtlasFactorResult["status"], string>
  > = {
    trend: {
      BULLISH: "FACTOR_TREND_BULLISH",
      NEUTRAL: "FACTOR_TREND_NEUTRAL",
      BEARISH: "FACTOR_TREND_BEARISH",
    },

    rsi: {
      BULLISH: "FACTOR_RSI_BULLISH",
      NEUTRAL: "FACTOR_RSI_NEUTRAL",
      BEARISH: "FACTOR_RSI_BEARISH",
    },

    macd: {
      BULLISH: "FACTOR_MACD_BULLISH",
      NEUTRAL: "FACTOR_MACD_NEUTRAL",
      BEARISH: "FACTOR_MACD_BEARISH",
    },

    volume: {
      BULLISH: "FACTOR_VOLUME_BULLISH",
      NEUTRAL: "FACTOR_VOLUME_NEUTRAL",
      BEARISH: "FACTOR_VOLUME_BEARISH",
    },

    momentum: {
      BULLISH: "FACTOR_MOMENTUM_BULLISH",
      NEUTRAL: "FACTOR_MOMENTUM_NEUTRAL",
      BEARISH: "FACTOR_MOMENTUM_BEARISH",
    },
  };

  return { code: codes[name][status] };
}

function createFactorResult(
  name: AtlasFactorName,
  label: string,
  value: number
): AtlasFactorResult {
  const normalizedValue = normalizeIndicator(value);
  const maxScore = FACTOR_WEIGHTS[name];

  return {
    name,
    label,
    score: calculateFactorScore(
      normalizedValue,
      maxScore
    ),
    maxScore,
    status: getFactorStatus(normalizedValue),
    explanation: getFactorExplanation(
      name,
      normalizedValue
    ),
  };
}

function getSignal(score: number): AtlasSignal {
  if (score >= 80) {
    return "STRONG_LONG";
  }

  if (score >= 62) {
    return "LONG";
  }

  if (score <= 20) {
    return "STRONG_SHORT";
  }

  if (score <= 38) {
    return "SHORT";
  }

  return "NEUTRAL";
}

function getConfidence(score: number) {
  const distanceFromNeutral = Math.abs(score - 50);

  return clamp(
    Math.round(50 + distanceFromNeutral),
    50,
    100
  );
}

function getRisk(
  score: number,
  factors: AtlasFactorResult[]
): AtlasRisk {
  const bullishFactors = factors.filter(
    (factor) => factor.status === "BULLISH"
  ).length;

  const bearishFactors = factors.filter(
    (factor) => factor.status === "BEARISH"
  ).length;

  const conflictingFactors =
    bullishFactors > 0 && bearishFactors > 0;

  if (
    conflictingFactors ||
    (score >= 40 && score <= 60)
  ) {
    return "HIGH";
  }

  if (score >= 75 || score <= 25) {
    return "LOW";
  }

  return "MODERATE";
}

function getSummary(
  signal: AtlasSignal,
  risk: AtlasRisk,
  factors: AtlasFactorResult[]
): AtlasReasonCode[] {
  const bullishNames = factors
    .filter((factor) => factor.status === "BULLISH")
    .map((factor) => factor.name);

  const bearishNames = factors
    .filter((factor) => factor.status === "BEARISH")
    .map((factor) => factor.name);

  const neutralNames = factors
    .filter((factor) => factor.status === "NEUTRAL")
    .map((factor) => factor.name);

  let directionSummary: AtlasReasonCode;

  switch (signal) {
    case "STRONG_LONG":
      directionSummary =
        bullishNames.length > 0
          ? {
              code: "SUMMARY_STRONG_LONG_WITH_FACTORS",
              params: { factorList: bullishNames },
            }
          : { code: "SUMMARY_STRONG_LONG_NO_FACTORS" };
      break;

    case "LONG":
      directionSummary =
        bullishNames.length > 0
          ? {
              code: "SUMMARY_LONG_WITH_FACTORS",
              params: { factorList: bullishNames },
            }
          : { code: "SUMMARY_LONG_NO_FACTORS" };
      break;

    case "STRONG_SHORT":
      directionSummary =
        bearishNames.length > 0
          ? {
              code: "SUMMARY_STRONG_SHORT_WITH_FACTORS",
              params: { factorList: bearishNames },
            }
          : { code: "SUMMARY_STRONG_SHORT_NO_FACTORS" };
      break;

    case "SHORT":
      directionSummary =
        bearishNames.length > 0
          ? {
              code: "SUMMARY_SHORT_WITH_FACTORS",
              params: { factorList: bearishNames },
            }
          : { code: "SUMMARY_SHORT_NO_FACTORS" };
      break;

    case "NEUTRAL":
      directionSummary =
        bullishNames.length > 0 &&
        bearishNames.length > 0
          ? {
              code: "SUMMARY_NEUTRAL_CONFLICTING",
              params: {
                bullishList: bullishNames,
                bearishList: bearishNames,
              },
            }
          : { code: "SUMMARY_NEUTRAL_BALANCED" };
      break;
  }

  const parts: AtlasReasonCode[] = [directionSummary];

  if (
    neutralNames.length > 0 &&
    signal !== "NEUTRAL"
  ) {
    parts.push({
      code: "SUMMARY_CONFIRMATION_LIMITED",
      params: { neutralList: neutralNames },
    });
  }

  const riskCode =
    risk === "LOW"
      ? "SUMMARY_RISK_LOW"
      : risk === "MODERATE"
        ? "SUMMARY_RISK_MODERATE"
        : "SUMMARY_RISK_HIGH";

  parts.push({ code: riskCode });

  return parts;
}

export function analyzeMarket(
  input: AtlasMarketInput
): AtlasAnalysis {
  const factors: AtlasFactorResult[] = [
    createFactorResult(
      "trend",
      "Trend",
      input.trend
    ),

    createFactorResult(
      "rsi",
      "RSI",
      input.rsi
    ),

    createFactorResult(
      "macd",
      "MACD",
      input.macd
    ),

    createFactorResult(
      "volume",
      "Volume",
      input.volume
    ),

    createFactorResult(
      "momentum",
      "Momentum",
      input.momentum
    ),
  ];

  const score = factors.reduce(
    (totalScore, factor) =>
      totalScore + factor.score,
    0
  );

  const signal = getSignal(score);
  const risk = getRisk(score, factors);

  return {
    score,
    signal,
    confidence: getConfidence(score),
    risk,
    factors,
    summary: getSummary(
      signal,
      risk,
      factors
    ),
  };
}
