import type { AtlasMarketInput } from "@/lib/atlas/atlasEngine";

export type AtlasCandle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function clamp(value: number, minimum = -1, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function calculateEma(values: number[], period: number) {
  if (values.length === 0) {
    return 0;
  }

  const multiplier = 2 / (period + 1);

  return values.slice(1).reduce(
    (ema, value) => value * multiplier + ema * (1 - multiplier),
    values[0]
  );
}

function calculateRsi(closes: number[], period = 14) {
  if (closes.length <= period) {
    return 50;
  }

  const recentCloses = closes.slice(-(period + 1));

  let gains = 0;
  let losses = 0;

  for (let index = 1; index < recentCloses.length; index += 1) {
    const change = recentCloses[index] - recentCloses[index - 1];

    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;

  return 100 - 100 / (1 + relativeStrength);
}

function calculateTrend(closes: number[]) {
  if (closes.length < 50) {
    return 0;
  }

  const ema20 = calculateEma(closes.slice(-20), 20);
  const ema50 = calculateEma(closes.slice(-50), 50);

  if (ema50 === 0) {
    return 0;
  }

  const distance = (ema20 - ema50) / ema50;

  return clamp(distance * 40);
}

function calculateRsiScore(closes: number[]) {
  const rsi = calculateRsi(closes);

  if (rsi >= 45 && rsi <= 65) {
    return clamp((rsi - 45) / 20);
  }

  if (rsi > 65) {
    return clamp(1 - (rsi - 65) / 20);
  }

  return clamp((rsi - 45) / 20);
}

function calculateMacdScore(closes: number[]) {
  if (closes.length < 26) {
    return 0;
  }

  const ema12 = calculateEma(closes.slice(-12), 12);
  const ema26 = calculateEma(closes.slice(-26), 26);

  if (ema26 === 0) {
    return 0;
  }

  const macdDistance = (ema12 - ema26) / ema26;

  return clamp(macdDistance * 60);
}

function calculateVolumeScore(candles: AtlasCandle[]) {
  if (candles.length < 20) {
    return 0;
  }

  const recentCandles = candles.slice(-20);
  const latestCandle = recentCandles.at(-1);

  if (!latestCandle) {
    return 0;
  }

  const previousCandles = recentCandles.slice(0, -1);

  const averageVolume =
    previousCandles.reduce(
      (total, candle) => total + candle.volume,
      0
    ) / previousCandles.length;

  if (averageVolume === 0) {
    return 0;
  }

  const volumeDifference =
    (latestCandle.volume - averageVolume) / averageVolume;

  const candleDirection =
    latestCandle.close > latestCandle.open
      ? 1
      : latestCandle.close < latestCandle.open
        ? -1
        : 0;

  return clamp(volumeDifference * candleDirection);
}

function calculateMomentum(closes: number[]) {
  if (closes.length < 11) {
    return 0;
  }

  const latestClose = closes.at(-1);
  const previousClose = closes.at(-11);

  if (
    latestClose === undefined ||
    previousClose === undefined ||
    previousClose === 0
  ) {
    return 0;
  }

  const percentageChange =
    (latestClose - previousClose) / previousClose;

  return clamp(percentageChange * 20);
}

export function calculateAtlasIndicators(
  candles: AtlasCandle[]
): AtlasMarketInput {
  const validCandles = candles.filter(
    (candle) =>
      Number.isFinite(candle.open) &&
      Number.isFinite(candle.high) &&
      Number.isFinite(candle.low) &&
      Number.isFinite(candle.close) &&
      Number.isFinite(candle.volume)
  );

  const closes = validCandles.map((candle) => candle.close);

  return {
    trend: calculateTrend(closes),
    rsi: calculateRsiScore(closes),
    macd: calculateMacdScore(closes),
    volume: calculateVolumeScore(validCandles),
    momentum: calculateMomentum(closes),
  };
}