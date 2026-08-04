import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

export type FairValueGapDirection =
  | "BULLISH"
  | "BEARISH";

export type FairValueGap = {
  direction: FairValueGapDirection;

  high: number;
  low: number;
  midpoint: number;

  candleIndex: number;

  filled: boolean;
  strength: number;
};

export type FairValueGapResult = {
  bullishFairValueGaps: FairValueGap[];
  bearishFairValueGaps: FairValueGap[];

  nearestBullishFairValueGap:
    | FairValueGap
    | null;

  nearestBearishFairValueGap:
    | FairValueGap
    | null;

  currentPrice: number;

  summary: AtlasReasonCode;
};
export type AtlasCandle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: number;
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

function calculateCandleRange(
  candle: AtlasCandle
): number {
  return Math.max(
    candle.high - candle.low,
    Number.EPSILON
  );
}
function findBullishFairValueGaps(
  candles: AtlasCandle[]
): FairValueGap[] {
  const gaps: FairValueGap[] = [];

  for (let i = 2; i < candles.length; i += 1) {
    const first = candles[i - 2];
    const third = candles[i];

    if (first.high >= third.low) {
      continue;
    }

    gaps.push({
      direction: "BULLISH",
      high: third.low,
      low: first.high,
      midpoint:
        (third.low + first.high) / 2,
      candleIndex: i,
      filled: false,
      strength: Math.round(
        clamp(
          ((third.low - first.high) /
            calculateCandleRange(third)) *
            100,
          0,
          100
        )
      ),
    });
  }

  return gaps;
}
function findBearishFairValueGaps(
  candles: AtlasCandle[]
): FairValueGap[] {
  const gaps: FairValueGap[] = [];

  for (let i = 2; i < candles.length; i += 1) {
    const first = candles[i - 2];
    const third = candles[i];

    if (first.low <= third.high) {
      continue;
    }

    gaps.push({
      direction: "BEARISH",
      high: first.low,
      low: third.high,
      midpoint:
        (first.low + third.high) / 2,
      candleIndex: i,
      filled: false,
      strength: Math.round(
        clamp(
          ((first.low - third.high) /
            calculateCandleRange(third)) *
            100,
          0,
          100
        )
      ),
    });
  }

  return gaps;
}
function updateFilledStatus(
  gaps: FairValueGap[],
  candles: AtlasCandle[]
): FairValueGap[] {
  return gaps.map((gap) => {
    let filled = false;

    for (
      let i = gap.candleIndex + 1;
      i < candles.length;
      i += 1
    ) {
      const candle = candles[i];

      if (
        candle.low <= gap.midpoint &&
        candle.high >= gap.midpoint
      ) {
        filled = true;
        break;
      }
    }

    return {
      ...gap,
      filled,
    };
  });
}
function getUnfilledFairValueGaps(
  gaps: FairValueGap[]
): FairValueGap[] {
  return gaps.filter((gap) => !gap.filled);
}
function getNearestFairValueGap(
  gaps: FairValueGap[],
  currentPrice: number
): FairValueGap | null {
  if (gaps.length === 0) {
    return null;
  }

  return gaps.reduce((nearest, gap) => {
    const nearestDistance = Math.abs(
      nearest.midpoint - currentPrice
    );

    const currentDistance = Math.abs(
      gap.midpoint - currentPrice
    );

    return currentDistance < nearestDistance
      ? gap
      : nearest;
  });
}
export function analyzeFairValueGaps(
  candles: AtlasCandle[]
): FairValueGapResult {
  const currentPrice =
    candles.at(-1)?.close ?? 0;

  const bullishFairValueGaps =
    getUnfilledFairValueGaps(
      updateFilledStatus(
        findBullishFairValueGaps(candles),
        candles
      )
    );

  const bearishFairValueGaps =
    getUnfilledFairValueGaps(
      updateFilledStatus(
        findBearishFairValueGaps(candles),
        candles
      )
    );

  const nearestBullishFairValueGap =
    getNearestFairValueGap(
      bullishFairValueGaps,
      currentPrice
    );

  const nearestBearishFairValueGap =
    getNearestFairValueGap(
      bearishFairValueGaps,
      currentPrice
    );

  return {
    bullishFairValueGaps,
    bearishFairValueGaps,
    nearestBullishFairValueGap,
    nearestBearishFairValueGap,
    currentPrice,
    summary: {
      code: "FAIR_VALUE_GAP_SUMMARY",
      params: {
        bullishCount: bullishFairValueGaps.length,
        bearishCount: bearishFairValueGaps.length,
      },
    },
  };
}