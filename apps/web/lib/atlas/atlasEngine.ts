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
  explanation: string;
};

export type AtlasAnalysis = {
  score: number;
  signal: AtlasSignal;
  confidence: number;
  risk: AtlasRisk;
  factors: AtlasFactorResult[];
  summary: string;
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
) {
  const status = getFactorStatus(value);

  const explanations: Record<
    AtlasFactorName,
    Record<AtlasFactorResult["status"], string>
  > = {
    trend: {
      BULLISH:
        "Price structure indicates an upward market trend.",
      NEUTRAL:
        "The market trend is currently unclear or ranging.",
      BEARISH:
        "Price structure indicates a downward market trend.",
    },

    rsi: {
      BULLISH:
        "RSI supports positive momentum without extreme weakness.",
      NEUTRAL:
        "RSI is balanced and provides no strong directional edge.",
      BEARISH:
        "RSI indicates weak or negative market momentum.",
    },

    macd: {
      BULLISH:
        "MACD momentum supports further upside.",
      NEUTRAL:
        "MACD momentum is currently mixed.",
      BEARISH:
        "MACD momentum supports further downside.",
    },

    volume: {
      BULLISH:
        "Volume confirms the current bullish move.",
      NEUTRAL:
        "Volume provides limited confirmation.",
      BEARISH:
        "Volume confirms increased selling pressure.",
    },

    momentum: {
      BULLISH:
        "Short-term momentum is accelerating upward.",
      NEUTRAL:
        "Short-term momentum is currently balanced.",
      BEARISH:
        "Short-term momentum is accelerating downward.",
    },
  };

  return explanations[name][status];
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

function formatFactorList(
  factors: AtlasFactorResult[]
) {
  const labels = factors.map((factor) =>
    factor.label.toLowerCase()
  );

  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels
    .slice(0, -1)
    .join(", ")}, and ${labels.at(-1)}`;
}

function getSummary(
  signal: AtlasSignal,
  risk: AtlasRisk,
  factors: AtlasFactorResult[]
) {
  const bullishFactors = factors.filter(
    (factor) => factor.status === "BULLISH"
  );

  const bearishFactors = factors.filter(
    (factor) => factor.status === "BEARISH"
  );

  const neutralFactors = factors.filter(
    (factor) => factor.status === "NEUTRAL"
  );

  const bullishLabels =
    formatFactorList(bullishFactors);

  const bearishLabels =
    formatFactorList(bearishFactors);

  const neutralLabels =
    formatFactorList(neutralFactors);

  let directionSummary: string;

  switch (signal) {
    case "STRONG_LONG":
      directionSummary =
        bullishFactors.length > 0
          ? `Atlas detects strong bullish alignment, led by ${bullishLabels}.`
          : "Atlas detects strong bullish alignment across the market indicators.";
      break;

    case "LONG":
      directionSummary =
        bullishFactors.length > 0
          ? `Atlas detects a bullish market advantage, supported by ${bullishLabels}.`
          : "Atlas detects a bullish market advantage.";
      break;

    case "STRONG_SHORT":
      directionSummary =
        bearishFactors.length > 0
          ? `Atlas detects strong bearish alignment, led by ${bearishLabels}.`
          : "Atlas detects strong bearish alignment across the market indicators.";
      break;

    case "SHORT":
      directionSummary =
        bearishFactors.length > 0
          ? `Atlas detects a bearish market advantage, supported by ${bearishLabels}.`
          : "Atlas detects a bearish market advantage.";
      break;

    case "NEUTRAL":
      directionSummary =
        bullishFactors.length > 0 &&
        bearishFactors.length > 0
          ? `Atlas detects conflicting conditions. ${bullishLabels} support buyers, while ${bearishLabels} support sellers.`
          : "Atlas detects balanced conditions without a clear directional advantage.";
      break;
  }

  let confirmationSummary = "";

  if (
    neutralFactors.length > 0 &&
    signal !== "NEUTRAL"
  ) {
    confirmationSummary = ` Confirmation remains limited from ${neutralLabels}.`;
  }

  let riskSummary: string;

  switch (risk) {
    case "LOW":
      riskSummary =
        " Indicator alignment is strong, resulting in a lower relative setup risk.";

      break;

    case "MODERATE":
      riskSummary =
        " The setup has a directional advantage, but additional confirmation would improve its quality.";

      break;

    case "HIGH":
      riskSummary =
        " Conflicting or balanced indicators increase uncertainty, so caution is warranted.";

      break;
  }

  return `${directionSummary}${confirmationSummary}${riskSummary}`;
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