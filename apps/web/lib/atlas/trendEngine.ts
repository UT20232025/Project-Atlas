import type { AtlasIndicatorResult } from "@/lib/atlas/atlasIndicators";

export type TrendDirection =
  | "STRONG_BULLISH"
  | "BULLISH"
  | "SIDEWAYS"
  | "BEARISH"
  | "STRONG_BEARISH";

export type TrendEngineResult = {
  direction: TrendDirection;
  strength: number;
  confidence: number;
  explanation: string;
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

export function analyzeTrend(
  indicators: AtlasIndicatorResult
): TrendEngineResult {
  const {
    ema20,
    ema50,
    ema200,
    trendStatus,
  } = indicators;

  let strength = 50;

  const hasShortTermEmaData =
    ema20 !== null &&
    ema50 !== null;

  const hasFullEmaData =
    hasShortTermEmaData &&
    ema200 !== null;

  if (hasFullEmaData) {
    if (
      ema20 > ema50 &&
      ema50 > ema200
    ) {
      strength = 95;
    } else if (
      ema20 < ema50 &&
      ema50 < ema200
    ) {
      strength = 95;
    } else if (ema20 > ema50) {
      strength = 80;
    } else if (ema20 < ema50) {
      strength = 80;
    } else {
      strength = 55;
    }
  } else if (hasShortTermEmaData) {
    if (ema20 > ema50) {
      strength = 70;
    } else if (ema20 < ema50) {
      strength = 70;
    } else {
      strength = 50;
    }
  } else {
    strength = 40;
  }

  if (
    trendStatus === "SIDEWAYS"
  ) {
    strength = Math.min(
      strength,
      55
    );
  }

  const confidence = clamp(
    strength,
    0,
    100
  );

  let explanation: string;

  switch (trendStatus) {
    case "STRONG_BULLISH":
      explanation =
        hasFullEmaData
          ? "Strong bullish trend across EMA20, EMA50 and EMA200."
          : "Strong bullish trend detected, but complete EMA history is not yet available.";
      break;

    case "BULLISH":
      explanation =
        hasShortTermEmaData
          ? "Bullish trend with positive short-term EMA alignment."
          : "Bullish trend detected with limited EMA history.";
      break;

    case "SIDEWAYS":
      explanation =
        "Market is ranging without a clear directional trend.";
      break;

    case "BEARISH":
      explanation =
        hasShortTermEmaData
          ? "Bearish trend with negative short-term EMA alignment."
          : "Bearish trend detected with limited EMA history.";
      break;

    case "STRONG_BEARISH":
      explanation =
        hasFullEmaData
          ? "Strong bearish trend across EMA20, EMA50 and EMA200."
          : "Strong bearish trend detected, but complete EMA history is not yet available.";
      break;
  }

  return {
    direction: trendStatus,
    strength,
    confidence,
    explanation,
  };
}