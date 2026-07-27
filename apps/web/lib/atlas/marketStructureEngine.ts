import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";

export type MarketStructureTrend =
  | "BULLISH"
  | "BEARISH"
  | "RANGING";

export type MarketStructureEvent =
  | "BOS_BULLISH"
  | "BOS_BEARISH"
  | "CHOCH_BULLISH"
  | "CHOCH_BEARISH"
  | "NONE";

export type SwingPointType =
  | "HIGHER_HIGH"
  | "HIGHER_LOW"
  | "LOWER_HIGH"
  | "LOWER_LOW"
  | "EQUAL_HIGH"
  | "EQUAL_LOW";

export type MarketSwingPoint = {
  index: number;
  price: number;
  type: SwingPointType;
};

export type MarketStructureResult = {
  trend: MarketStructureTrend;
  event: MarketStructureEvent;

  latestSwingHigh: number | null;
  previousSwingHigh: number | null;

  latestSwingLow: number | null;
  previousSwingLow: number | null;

  swingHighType: SwingPointType | null;
  swingLowType: SwingPointType | null;

  bullishBreak: boolean;
  bearishBreak: boolean;

  strength: number;
  confidence: number;

  swingPoints: MarketSwingPoint[];
  explanation: string;
};

type RawSwingPoint = {
  index: number;
  price: number;
  kind: "HIGH" | "LOW";
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

function isValidCandle(
  candle: AtlasCandle
): boolean {
  return (
    Number.isFinite(candle.open) &&
    Number.isFinite(candle.high) &&
    Number.isFinite(candle.low) &&
    Number.isFinite(candle.close) &&
    candle.high >= candle.low
  );
}

function findSwingPoints(
  candles: AtlasCandle[],
  lookback = 2
): RawSwingPoint[] {
  const swingPoints: RawSwingPoint[] = [];

  for (
    let index = lookback;
    index < candles.length - lookback;
    index += 1
  ) {
    const current = candles[index];

    let isSwingHigh = true;
    let isSwingLow = true;

    for (
      let offset = 1;
      offset <= lookback;
      offset += 1
    ) {
      const previous =
        candles[index - offset];

      const next =
        candles[index + offset];

      if (
        current.high <= previous.high ||
        current.high <= next.high
      ) {
        isSwingHigh = false;
      }

      if (
        current.low >= previous.low ||
        current.low >= next.low
      ) {
        isSwingLow = false;
      }
    }

    if (isSwingHigh) {
      swingPoints.push({
        index,
        price: current.high,
        kind: "HIGH",
      });
    }

    if (isSwingLow) {
      swingPoints.push({
        index,
        price: current.low,
        kind: "LOW",
      });
    }
  }

  return swingPoints.sort(
    (first, second) =>
      first.index - second.index
  );
}

function compareHighs(
  previous: number,
  latest: number
): SwingPointType {
  const tolerance =
    Math.abs(previous) * 0.001;

  if (
    Math.abs(latest - previous) <= tolerance
  ) {
    return "EQUAL_HIGH";
  }

  return latest > previous
    ? "HIGHER_HIGH"
    : "LOWER_HIGH";
}

function compareLows(
  previous: number,
  latest: number
): SwingPointType {
  const tolerance =
    Math.abs(previous) * 0.001;

  if (
    Math.abs(latest - previous) <= tolerance
  ) {
    return "EQUAL_LOW";
  }

  return latest > previous
    ? "HIGHER_LOW"
    : "LOWER_LOW";
}

function determineTrend(
  swingHighType: SwingPointType | null,
  swingLowType: SwingPointType | null
): MarketStructureTrend {
  const bullishHigh =
    swingHighType === "HIGHER_HIGH";

  const bullishLow =
    swingLowType === "HIGHER_LOW";

  const bearishHigh =
    swingHighType === "LOWER_HIGH";

  const bearishLow =
    swingLowType === "LOWER_LOW";

  if (bullishHigh && bullishLow) {
    return "BULLISH";
  }

  if (bearishHigh && bearishLow) {
    return "BEARISH";
  }

  return "RANGING";
}

function determineEvent(
  trend: MarketStructureTrend,
  bullishBreak: boolean,
  bearishBreak: boolean
): MarketStructureEvent {
  if (
    trend === "BULLISH" &&
    bullishBreak
  ) {
    return "BOS_BULLISH";
  }

  if (
    trend === "BEARISH" &&
    bearishBreak
  ) {
    return "BOS_BEARISH";
  }

  if (
    trend === "BEARISH" &&
    bullishBreak
  ) {
    return "CHOCH_BULLISH";
  }

  if (
    trend === "BULLISH" &&
    bearishBreak
  ) {
    return "CHOCH_BEARISH";
  }

  return "NONE";
}

function buildExplanation(
  trend: MarketStructureTrend,
  event: MarketStructureEvent,
  swingHighType: SwingPointType | null,
  swingLowType: SwingPointType | null
): string {
  const trendText =
    trend === "BULLISH"
      ? "Market structure is bullish."
      : trend === "BEARISH"
        ? "Market structure is bearish."
        : "Market structure is currently ranging.";

  const highText = swingHighType
    ? `The latest swing high is classified as ${swingHighType}.`
    : "There is not enough swing-high data.";

  const lowText = swingLowType
    ? `The latest swing low is classified as ${swingLowType}.`
    : "There is not enough swing-low data.";

  const eventText =
    event === "BOS_BULLISH"
      ? "A bullish break of structure is present."
      : event === "BOS_BEARISH"
        ? "A bearish break of structure is present."
        : event === "CHOCH_BULLISH"
          ? "A bullish change of character may signal a trend reversal."
          : event === "CHOCH_BEARISH"
            ? "A bearish change of character may signal a trend reversal."
            : "No confirmed break of structure or change of character is present.";

  return `${trendText} ${highText} ${lowText} ${eventText}`;
}

export function analyzeMarketStructure(
  candles: AtlasCandle[]
): MarketStructureResult {
  const validCandles =
    candles.filter(isValidCandle);

  if (validCandles.length < 20) {
    return {
      trend: "RANGING",
      event: "NONE",

      latestSwingHigh: null,
      previousSwingHigh: null,

      latestSwingLow: null,
      previousSwingLow: null,

      swingHighType: null,
      swingLowType: null,

      bullishBreak: false,
      bearishBreak: false,

      strength: 0,
      confidence: 0,

      swingPoints: [],

      explanation:
        "Not enough candle data was available for market structure analysis.",
    };
  }

  const rawSwingPoints =
    findSwingPoints(validCandles);

  const swingHighs =
    rawSwingPoints.filter(
      (point) =>
        point.kind === "HIGH"
    );

  const swingLows =
    rawSwingPoints.filter(
      (point) =>
        point.kind === "LOW"
    );

  const latestHigh =
    swingHighs.at(-1);

  const previousHigh =
    swingHighs.at(-2);

  const latestLow =
    swingLows.at(-1);

  const previousLow =
    swingLows.at(-2);

  const swingHighType =
    latestHigh && previousHigh
      ? compareHighs(
          previousHigh.price,
          latestHigh.price
        )
      : null;

  const swingLowType =
    latestLow && previousLow
      ? compareLows(
          previousLow.price,
          latestLow.price
        )
      : null;

  const trend =
    determineTrend(
      swingHighType,
      swingLowType
    );

  const latestClose =
    validCandles.at(-1)?.close ?? 0;

  const bullishBreak =
    latestHigh !== undefined &&
    latestClose > latestHigh.price;

  const bearishBreak =
    latestLow !== undefined &&
    latestClose < latestLow.price;

  const event =
    determineEvent(
      trend,
      bullishBreak,
      bearishBreak
    );

  let strength = 35;

  if (trend !== "RANGING") {
    strength += 25;
  }

  if (
    event === "BOS_BULLISH" ||
    event === "BOS_BEARISH"
  ) {
    strength += 25;
  }

  if (
    event === "CHOCH_BULLISH" ||
    event === "CHOCH_BEARISH"
  ) {
    strength += 15;
  }

  if (
    swingHighType === "EQUAL_HIGH" ||
    swingLowType === "EQUAL_LOW"
  ) {
    strength -= 10;
  }

  strength = clamp(
    Math.round(strength),
    0,
    100
  );

  const confidence = clamp(
    Math.round(
      strength +
        Math.min(
          rawSwingPoints.length,
          10
        )
    ),
    0,
    100
  );

  const swingPoints:
    MarketSwingPoint[] =
    rawSwingPoints.slice(-10).map(
      (point) => {
        let type: SwingPointType;

        if (point.kind === "HIGH") {
          const highPosition =
            swingHighs.findIndex(
              (high) =>
                high.index === point.index
            );

          const earlierHigh =
            swingHighs[
              highPosition - 1
            ];

          type = earlierHigh
            ? compareHighs(
                earlierHigh.price,
                point.price
              )
            : "EQUAL_HIGH";
        } else {
          const lowPosition =
            swingLows.findIndex(
              (low) =>
                low.index === point.index
            );

          const earlierLow =
            swingLows[
              lowPosition - 1
            ];

          type = earlierLow
            ? compareLows(
                earlierLow.price,
                point.price
              )
            : "EQUAL_LOW";
        }

        return {
          index: point.index,
          price: point.price,
          type,
        };
      }
    );

  return {
    trend,
    event,

    latestSwingHigh:
      latestHigh?.price ?? null,

    previousSwingHigh:
      previousHigh?.price ?? null,

    latestSwingLow:
      latestLow?.price ?? null,

    previousSwingLow:
      previousLow?.price ?? null,

    swingHighType,
    swingLowType,

    bullishBreak,
    bearishBreak,

    strength,
    confidence,

    swingPoints,

    explanation:
      buildExplanation(
        trend,
        event,
        swingHighType,
        swingLowType
      ),
  };
}