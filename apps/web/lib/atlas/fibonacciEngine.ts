export type FibDirection = "BULLISH" | "BEARISH" | "NONE";

export type FibonacciResult = {
  inGoldenPocket: boolean;
  // Directional bias when price is inside the golden pocket; NONE otherwise.
  direction: FibDirection;
  swingHigh: number | null;
  swingLow: number | null;
  goldenPocketLow: number | null;
  goldenPocketHigh: number | null;
};

type FibCandle = {
  high: number;
  low: number;
  close: number;
};

const DEFAULT_LOOKBACK = 60;

// The "golden pocket": the 0.618–0.786 retracement band.
const GP_START = 0.618;
const GP_END = 0.786;

function round(value: number): number {
  return Number(value.toFixed(8));
}

export function analyzeFibonacci(
  candles: readonly FibCandle[],
  lookback: number = DEFAULT_LOOKBACK
): FibonacciResult {
  const price =
    candles.length > 0
      ? candles[candles.length - 1].close
      : 0;

  const window = candles.slice(-lookback);

  const empty: FibonacciResult = {
    inGoldenPocket: false,
    direction: "NONE",
    swingHigh: null,
    swingLow: null,
    goldenPocketLow: null,
    goldenPocketHigh: null,
  };

  if (
    window.length === 0 ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return empty;
  }

  let swingHigh = -Infinity;
  let swingLow = Infinity;
  let highIndex = 0;
  let lowIndex = 0;

  window.forEach((candle, index) => {
    if (candle.high > swingHigh) {
      swingHigh = candle.high;
      highIndex = index;
    }

    if (candle.low < swingLow) {
      swingLow = candle.low;
      lowIndex = index;
    }
  });

  const range = swingHigh - swingLow;

  if (!(range > 0)) {
    return {
      ...empty,
      swingHigh: round(swingHigh),
      swingLow: round(swingLow),
    };
  }

  // The more recent extreme (larger index) defines the last leg's
  // direction, and therefore where a retracement pulls back to.
  let direction: FibDirection;
  let goldenPocketLow: number;
  let goldenPocketHigh: number;

  if (highIndex > lowIndex) {
    // Last leg up → bullish retracement measured down from the high.
    direction = "BULLISH";
    goldenPocketHigh = swingHigh - GP_START * range;
    goldenPocketLow = swingHigh - GP_END * range;
  } else {
    // Last leg down → bearish retracement measured up from the low.
    direction = "BEARISH";
    goldenPocketLow = swingLow + GP_START * range;
    goldenPocketHigh = swingLow + GP_END * range;
  }

  const inGoldenPocket =
    price >= goldenPocketLow &&
    price <= goldenPocketHigh;

  return {
    inGoldenPocket,
    direction: inGoldenPocket ? direction : "NONE",
    swingHigh: round(swingHigh),
    swingLow: round(swingLow),
    goldenPocketLow: round(goldenPocketLow),
    goldenPocketHigh: round(goldenPocketHigh),
  };
}
