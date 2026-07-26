import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";

export type AtlasPriceLevels = {
  support: number | null;
  resistance: number | null;
};

type PricePoint = {
  price: number;
  strength: number;
};

function roundPrice(value: number): number {
  if (value >= 1000) {
    return Math.round(value * 10) / 10;
  }

  if (value >= 1) {
    return Math.round(value * 100) / 100;
  }

  return Math.round(value * 100000) / 100000;
}

function isValidCandle(candle: AtlasCandle): boolean {
  return (
    Number.isFinite(candle.open) &&
    Number.isFinite(candle.high) &&
    Number.isFinite(candle.low) &&
    Number.isFinite(candle.close) &&
    candle.high >= candle.low
  );
}

function findSwingLows(
  candles: AtlasCandle[],
  lookback = 2
): PricePoint[] {
  const swingLows: PricePoint[] = [];

  for (
    let index = lookback;
    index < candles.length - lookback;
    index += 1
  ) {
    const currentCandle = candles[index];

    let isSwingLow = true;

    for (
      let offset = 1;
      offset <= lookback;
      offset += 1
    ) {
      const previousCandle = candles[index - offset];
      const nextCandle = candles[index + offset];

      if (
        currentCandle.low >= previousCandle.low ||
        currentCandle.low >= nextCandle.low
      ) {
        isSwingLow = false;
        break;
      }
    }

    if (isSwingLow) {
      swingLows.push({
        price: currentCandle.low,
        strength: 1,
      });
    }
  }

  return swingLows;
}

function findSwingHighs(
  candles: AtlasCandle[],
  lookback = 2
): PricePoint[] {
  const swingHighs: PricePoint[] = [];

  for (
    let index = lookback;
    index < candles.length - lookback;
    index += 1
  ) {
    const currentCandle = candles[index];

    let isSwingHigh = true;

    for (
      let offset = 1;
      offset <= lookback;
      offset += 1
    ) {
      const previousCandle = candles[index - offset];
      const nextCandle = candles[index + offset];

      if (
        currentCandle.high <= previousCandle.high ||
        currentCandle.high <= nextCandle.high
      ) {
        isSwingHigh = false;
        break;
      }
    }

    if (isSwingHigh) {
      swingHighs.push({
        price: currentCandle.high,
        strength: 1,
      });
    }
  }

  return swingHighs;
}

function mergeNearbyLevels(
  levels: PricePoint[],
  tolerancePercentage = 0.003
): PricePoint[] {
  const sortedLevels = [...levels].sort(
    (firstLevel, secondLevel) =>
      firstLevel.price - secondLevel.price
  );

  const mergedLevels: PricePoint[] = [];

  for (const level of sortedLevels) {
    const nearbyLevel = mergedLevels.find(
      (existingLevel) => {
        if (existingLevel.price === 0) {
          return false;
        }

        const difference = Math.abs(
          level.price - existingLevel.price
        );

        return (
          difference / existingLevel.price <=
          tolerancePercentage
        );
      }
    );

    if (!nearbyLevel) {
      mergedLevels.push({
        price: level.price,
        strength: level.strength,
      });

      continue;
    }

    const totalStrength =
      nearbyLevel.strength + level.strength;

    nearbyLevel.price =
      (nearbyLevel.price * nearbyLevel.strength +
        level.price * level.strength) /
      totalStrength;

    nearbyLevel.strength = totalStrength;
  }

  return mergedLevels;
}

function findNearestSupport(
  levels: PricePoint[],
  currentPrice: number
): number | null {
  const supportLevels = levels
    .filter((level) => level.price < currentPrice)
    .sort((firstLevel, secondLevel) => {
      const distanceDifference =
        currentPrice - firstLevel.price -
        (currentPrice - secondLevel.price);

      if (distanceDifference !== 0) {
        return distanceDifference;
      }

      return secondLevel.strength - firstLevel.strength;
    });

  return supportLevels[0]?.price ?? null;
}

function findNearestResistance(
  levels: PricePoint[],
  currentPrice: number
): number | null {
  const resistanceLevels = levels
    .filter((level) => level.price > currentPrice)
    .sort((firstLevel, secondLevel) => {
      const distanceDifference =
        firstLevel.price - currentPrice -
        (secondLevel.price - currentPrice);

      if (distanceDifference !== 0) {
        return distanceDifference;
      }

      return secondLevel.strength - firstLevel.strength;
    });

  return resistanceLevels[0]?.price ?? null;
}

export function calculateSupportResistance(
  candles: AtlasCandle[],
  period = 60
): AtlasPriceLevels {
  const validCandles = candles
    .filter(isValidCandle)
    .slice(-period);

  const latestCandle = validCandles.at(-1);

  if (!latestCandle || validCandles.length < 10) {
    return {
      support: null,
      resistance: null,
    };
  }

  const swingLows = mergeNearbyLevels(
    findSwingLows(validCandles)
  );

  const swingHighs = mergeNearbyLevels(
    findSwingHighs(validCandles)
  );

  const support = findNearestSupport(
    swingLows,
    latestCandle.close
  );

  const resistance = findNearestResistance(
    swingHighs,
    latestCandle.close
  );

  return {
    support:
      support === null ? null : roundPrice(support),
    resistance:
      resistance === null
        ? null
        : roundPrice(resistance),
  };
}