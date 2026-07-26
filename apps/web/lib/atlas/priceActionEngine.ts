import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";

export type MarketStructure =
  | "BULLISH"
  | "BEARISH"
  | "RANGING";

export type SwingPoint = {
  index: number;
  price: number;
};

export type PriceActionResult = {
  structure: MarketStructure;

  higherHigh: boolean;
  higherLow: boolean;

  lowerHigh: boolean;
  lowerLow: boolean;

  lastHigh: SwingPoint | null;
  previousHigh: SwingPoint | null;

  lastLow: SwingPoint | null;
  previousLow: SwingPoint | null;

  confidence: number;

  explanation: string;
};

function findSwingHighs(
  candles: AtlasCandle[]
): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (
    let i = 2;
    i < candles.length - 2;
    i++
  ) {
    const high = candles[i].high;

    if (
      high > candles[i - 1].high &&
      high > candles[i - 2].high &&
      high > candles[i + 1].high &&
      high > candles[i + 2].high
    ) {
      swings.push({
        index: i,
        price: high,
      });
    }
  }

  return swings;
}

function findSwingLows(
  candles: AtlasCandle[]
): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (
    let i = 2;
    i < candles.length - 2;
    i++
  ) {
    const low = candles[i].low;

    if (
      low < candles[i - 1].low &&
      low < candles[i - 2].low &&
      low < candles[i + 1].low &&
      low < candles[i + 2].low
    ) {
      swings.push({
        index: i,
        price: low,
      });
    }
  }

  return swings;
}

export function analyzePriceAction(
  candles: AtlasCandle[]
): PriceActionResult {
  const highs =
    findSwingHighs(candles);

  const lows =
    findSwingLows(candles);

  const lastHigh =
    highs.length >= 1
      ? highs[highs.length - 1]
      : null;

  const previousHigh =
    highs.length >= 2
      ? highs[highs.length - 2]
      : null;

  const lastLow =
    lows.length >= 1
      ? lows[lows.length - 1]
      : null;

  const previousLow =
    lows.length >= 2
      ? lows[lows.length - 2]
      : null;

  const higherHigh =
    lastHigh !== null &&
    previousHigh !== null &&
    lastHigh.price >
      previousHigh.price;

  const lowerHigh =
    lastHigh !== null &&
    previousHigh !== null &&
    lastHigh.price <
      previousHigh.price;

  const higherLow =
    lastLow !== null &&
    previousLow !== null &&
    lastLow.price >
      previousLow.price;

  const lowerLow =
    lastLow !== null &&
    previousLow !== null &&
    lastLow.price <
      previousLow.price;

  let structure: MarketStructure =
    "RANGING";

  let confidence = 50;

  let explanation =
    "No clear market structure.";

  if (
    higherHigh &&
    higherLow
  ) {
    structure = "BULLISH";
    confidence = 90;
    explanation =
      "Higher highs and higher lows detected.";
  } else if (
    lowerHigh &&
    lowerLow
  ) {
    structure = "BEARISH";
    confidence = 90;
    explanation =
      "Lower highs and lower lows detected.";
  } else if (
    higherHigh ||
    higherLow ||
    lowerHigh ||
    lowerLow
  ) {
    confidence = 65;
    explanation =
      "Mixed market structure detected.";
  }

  return {
    structure,

    higherHigh,
    higherLow,

    lowerHigh,
    lowerLow,

    lastHigh,
    previousHigh,

    lastLow,
    previousLow,

    confidence,

    explanation,
  };
}