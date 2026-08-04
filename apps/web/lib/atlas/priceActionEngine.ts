import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

export type MarketStructure =
  | "BULLISH"
  | "BEARISH"
  | "RANGING";

export type BreakOfStructureDirection =
  | "BULLISH"
  | "BEARISH"
  | "NONE";

export type ChangeOfCharacterDirection =
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

  bullishChoch: boolean;
  bearishChoch: boolean;
  chochDirection: ChangeOfCharacterDirection;
  chochLevel: number | null;

  lastHigh: SwingPoint | null;
  previousHigh: SwingPoint | null;

  lastLow: SwingPoint | null;
  previousLow: SwingPoint | null;

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

function findLatestCloseAboveIndex(
  candles: AtlasCandle[],
  level: number,
  startIndex: number
): number {
  let latestIndex = -1;

  for (
    let i = Math.max(startIndex, 0);
    i < candles.length;
    i++
  ) {
    if (candles[i].close > level) {
      latestIndex = i;
    }
  }

  return latestIndex;
}

function findLatestCloseBelowIndex(
  candles: AtlasCandle[],
  level: number,
  startIndex: number
): number {
  let latestIndex = -1;

  for (
    let i = Math.max(startIndex, 0);
    i < candles.length;
    i++
  ) {
    if (candles[i].close < level) {
      latestIndex = i;
    }
  }

  return latestIndex;
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

      bullishChoch: false,
      bearishChoch: false,
      chochDirection: "NONE",
      chochLevel: null,

      lastHigh: null,
      previousHigh: null,

      lastLow: null,
      previousLow: null,

      confidence: 0,

      explanation: { code: "PRICE_ACTION_INSUFFICIENT_DATA" },
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

  const bullishBreakIndex =
    lastHigh !== null
      ? findLatestCloseAboveIndex(
          candles,
          lastHigh.price,
          lastHigh.index + 1
        )
      : -1;

  const bearishBreakIndex =
    lastLow !== null
      ? findLatestCloseBelowIndex(
          candles,
          lastLow.price,
          lastLow.index + 1
        )
      : -1;

  let bullishBos = false;
  let bearishBos = false;

  let bosDirection:
    BreakOfStructureDirection =
    "NONE";

  let bosLevel: number | null =
    null;

  let bullishChoch = false;
  let bearishChoch = false;

  let chochDirection:
    ChangeOfCharacterDirection =
    "NONE";

  let chochLevel: number | null =
    null;

  if (structure === "BULLISH") {
    bullishBos =
      bullishBreakIndex >= 0;

    bearishChoch =
      bearishBreakIndex >= 0;

    if (bullishBos) {
      bosDirection = "BULLISH";
      bosLevel =
        lastHigh?.price ?? null;
    }

    if (bearishChoch) {
      chochDirection = "BEARISH";
      chochLevel =
        lastLow?.price ?? null;
    }
  } else if (
    structure === "BEARISH"
  ) {
    bearishBos =
      bearishBreakIndex >= 0;

    bullishChoch =
      bullishBreakIndex >= 0;

    if (bearishBos) {
      bosDirection = "BEARISH";
      bosLevel =
        lastLow?.price ?? null;
    }

    if (bullishChoch) {
      chochDirection = "BULLISH";
      chochLevel =
        lastHigh?.price ?? null;
    }
  } else {
    if (
      bullishBreakIndex >= 0 &&
      bullishBreakIndex >
        bearishBreakIndex
    ) {
      bullishBos = true;
      bosDirection = "BULLISH";
      bosLevel =
        lastHigh?.price ?? null;
    } else if (
      bearishBreakIndex >= 0 &&
      bearishBreakIndex >
        bullishBreakIndex
    ) {
      bearishBos = true;
      bosDirection = "BEARISH";
      bosLevel =
        lastLow?.price ?? null;
    }
  }

  const latestBosIndex =
    bosDirection === "BULLISH"
      ? bullishBreakIndex
      : bosDirection === "BEARISH"
        ? bearishBreakIndex
        : -1;

  const latestChochIndex =
    chochDirection === "BULLISH"
      ? bullishBreakIndex
      : chochDirection === "BEARISH"
        ? bearishBreakIndex
        : -1;

  const latestEventIsChoch =
    latestChochIndex >= 0 &&
    latestChochIndex >=
      latestBosIndex;

  if (
    structure === "BULLISH" &&
    bullishBos &&
    !latestEventIsChoch
  ) {
    confidence += 12;
  } else if (
    structure === "BEARISH" &&
    bearishBos &&
    !latestEventIsChoch
  ) {
    confidence += 12;
  }

  if (latestEventIsChoch) {
    confidence += 8;
  }

  if (
    bullishBos &&
    bearishChoch
  ) {
    confidence -= 8;
  }

  if (
    bearishBos &&
    bullishChoch
  ) {
    confidence -= 8;
  }

  confidence = clamp(
    confidence,
    0,
    100
  );

  let explanation: AtlasReasonCode = {
    code: "PRICE_ACTION_NO_CLEAR_STRUCTURE",
  };

  if (
    latestEventIsChoch &&
    chochDirection === "BEARISH"
  ) {
    explanation = { code: "PRICE_ACTION_BEARISH_CHOCH_DETECTED" };
  } else if (
    latestEventIsChoch &&
    chochDirection === "BULLISH"
  ) {
    explanation = { code: "PRICE_ACTION_BULLISH_CHOCH_DETECTED" };
  } else if (
    structure === "BULLISH" &&
    bosDirection === "BULLISH"
  ) {
    explanation = { code: "PRICE_ACTION_BULLISH_STRUCTURE_CONFIRMED" };
  } else if (
    structure === "BEARISH" &&
    bosDirection === "BEARISH"
  ) {
    explanation = { code: "PRICE_ACTION_BEARISH_STRUCTURE_CONFIRMED" };
  } else if (
    structure === "BULLISH"
  ) {
    explanation = { code: "PRICE_ACTION_BULLISH_NO_BREAK" };
  } else if (
    structure === "BEARISH"
  ) {
    explanation = { code: "PRICE_ACTION_BEARISH_NO_BREAK" };
  } else if (
    bosDirection === "BULLISH"
  ) {
    explanation = { code: "PRICE_ACTION_BULLISH_BREAK_RANGING" };
  } else if (
    bosDirection === "BEARISH"
  ) {
    explanation = { code: "PRICE_ACTION_BEARISH_BREAK_RANGING" };
  } else if (
    higherHigh ||
    higherLow ||
    lowerHigh ||
    lowerLow
  ) {
    explanation = { code: "PRICE_ACTION_MIXED_STRUCTURE" };
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

    bullishChoch,
    bearishChoch,
    chochDirection,
    chochLevel,

    lastHigh,
    previousHigh,

    lastLow,
    previousLow,

    confidence,

    explanation,
  };
}