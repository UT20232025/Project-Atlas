import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";

export type MarketStructure =
  | "BULLISH"
  | "BEARISH"
  | "RANGING";

export type BreakOfStructureDirection =
  | "BULLISH"
  | "BEARISH"
  | "NONE";

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

  bullishBos: boolean;
  bearishBos: boolean;
  bosDirection: BreakOfStructureDirection;
  bosLevel: number | null;

  lastHigh: SwingPoint | null;
  previousHigh: SwingPoint | null;

  lastLow: SwingPoint | null;
  previousLow: SwingPoint | null;

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

function hasClosedAboveLevel(
  candles: AtlasCandle[],
  level: number,
  startIndex: number
): boolean {
  for (
    let i = Math.max(startIndex, 0);
    i < candles.length;
    i++
  ) {
    if (candles[i].close > level) {
      return true;
    }
  }

  return false;
}

function hasClosedBelowLevel(
  candles: AtlasCandle[],
  level: number,
  startIndex: number
): boolean {
  for (
    let i = Math.max(startIndex, 0);
    i < candles.length;
    i++
  ) {
    if (candles[i].close < level) {
      return true;
    }
  }

  return false;
}

export function analyzePriceAction(
  candles: AtlasCandle[]
): PriceActionResult {
  if (candles.length < 5) {
    return {
      structure: "RANGING",

      higherHigh: false,
      higherLow: false,

      lowerHigh: false,
      lowerLow: false,

      bullishBos: false,
      bearishBos: false,
      bosDirection: "NONE",
      bosLevel: null,

      lastHigh: null,
      previousHigh: null,

      lastLow: null,
      previousLow: null,

      confidence: 0,

      explanation:
        "Not enough candle data to analyze price action.",
    };
  }

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

  if (
    higherHigh &&
    higherLow
  ) {
    structure = "BULLISH";
    confidence = 82;
  } else if (
    lowerHigh &&
    lowerLow
  ) {
    structure = "BEARISH";
    confidence = 82;
  } else if (
    higherHigh ||
    higherLow ||
    lowerHigh ||
    lowerLow
  ) {
    confidence = 60;
  }

  const bullishBos =
    lastHigh !== null &&
    hasClosedAboveLevel(
      candles,
      lastHigh.price,
      lastHigh.index + 1
    );

  const bearishBos =
    lastLow !== null &&
    hasClosedBelowLevel(
      candles,
      lastLow.price,
      lastLow.index + 1
    );

  let bosDirection:
    BreakOfStructureDirection =
    "NONE";

  let bosLevel: number | null =
    null;

  if (
    bullishBos &&
    !bearishBos
  ) {
    bosDirection = "BULLISH";
    bosLevel =
      lastHigh?.price ?? null;
  } else if (
    bearishBos &&
    !bullishBos
  ) {
    bosDirection = "BEARISH";
    bosLevel =
      lastLow?.price ?? null;
  } else if (
    bullishBos &&
    bearishBos
  ) {
    const bullishBreakIndex =
      candles.findIndex(
        (candle, index) =>
          lastHigh !== null &&
          index >
            lastHigh.index &&
          candle.close >
            lastHigh.price
      );

    const bearishBreakIndex =
      candles.findIndex(
        (candle, index) =>
          lastLow !== null &&
          index >
            lastLow.index &&
          candle.close <
            lastLow.price
      );

    if (
      bullishBreakIndex >
      bearishBreakIndex
    ) {
      bosDirection =
        "BULLISH";
      bosLevel =
        lastHigh?.price ??
        null;
    } else if (
      bearishBreakIndex >
      bullishBreakIndex
    ) {
      bosDirection =
        "BEARISH";
      bosLevel =
        lastLow?.price ??
        null;
    }
  }

  if (
    structure === "BULLISH" &&
    bosDirection === "BULLISH"
  ) {
    confidence += 12;
  } else if (
    structure === "BEARISH" &&
    bosDirection === "BEARISH"
  ) {
    confidence += 12;
  } else if (
    structure !== "RANGING" &&
    bosDirection !== "NONE"
  ) {
    confidence -= 15;
  }

  confidence = clamp(
    confidence,
    0,
    100
  );

  let explanation =
    "No clear market structure or break of structure detected.";

  if (
    structure === "BULLISH" &&
    bosDirection === "BULLISH"
  ) {
    explanation =
      "Bullish market structure confirmed with a close above the latest swing high.";
  } else if (
    structure === "BEARISH" &&
    bosDirection === "BEARISH"
  ) {
    explanation =
      "Bearish market structure confirmed with a close below the latest swing low.";
  } else if (
    bosDirection === "BULLISH"
  ) {
    explanation =
      "Bullish break of structure detected above the latest swing high.";
  } else if (
    bosDirection === "BEARISH"
  ) {
    explanation =
      "Bearish break of structure detected below the latest swing low.";
  } else if (
    structure === "BULLISH"
  ) {
    explanation =
      "Higher highs and higher lows detected, but no confirmed bullish break of structure.";
  } else if (
    structure === "BEARISH"
  ) {
    explanation =
      "Lower highs and lower lows detected, but no confirmed bearish break of structure.";
  } else if (
    higherHigh ||
    higherLow ||
    lowerHigh ||
    lowerLow
  ) {
    explanation =
      "Mixed market structure detected without a confirmed break.";
  }

  return {
    structure,

    higherHigh,
    higherLow,

    lowerHigh,
    lowerLow,

    bullishBos,
    bearishBos,
    bosDirection,
    bosLevel,

    lastHigh,
    previousHigh,

    lastLow,
    previousLow,

    confidence,

    explanation,
  };
}