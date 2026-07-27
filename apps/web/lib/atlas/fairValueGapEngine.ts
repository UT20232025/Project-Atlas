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

  summary: string;
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