import type { AtlasIndicatorResult } from "@/lib/atlas/atlasIndicators";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

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
  explanation: AtlasReasonCode;
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

  let explanation: AtlasReasonCode;

  switch (trendStatus) {
    case "STRONG_BULLISH":
      explanation = {
        code: hasFullEmaData
          ? "TREND_STRONG_BULLISH_FULL_EMA"
          : "TREND_STRONG_BULLISH_LIMITED_EMA",
      };
      break;

    case "BULLISH":
      explanation = {
        code: hasShortTermEmaData
          ? "TREND_BULLISH_FULL_EMA"
          : "TREND_BULLISH_LIMITED_EMA",
      };
      break;

    case "SIDEWAYS":
      explanation = { code: "TREND_SIDEWAYS" };
      break;

    case "BEARISH":
      explanation = {
        code: hasShortTermEmaData
          ? "TREND_BEARISH_FULL_EMA"
          : "TREND_BEARISH_LIMITED_EMA",
      };
      break;

    case "STRONG_BEARISH":
      explanation = {
        code: hasFullEmaData
          ? "TREND_STRONG_BEARISH_FULL_EMA"
          : "TREND_STRONG_BEARISH_LIMITED_EMA",
      };
      break;
  }

  return {
    direction: trendStatus,
    strength,
    confidence,
    explanation,
  };
}