import type { AtlasMarketInput } from "@/lib/atlas/atlasEngine";
import { calculateLatestEma } from "./indicators/ema";
import { calculateMacdScore } from "./indicators/macd";
import { calculateWilderRsi } from "./indicators/rsi";

export type AtlasCandle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function clamp(
  value: number,
  minimum = -1,
  maximum = 1
): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function calculateTrend(closes: number[]): number {
  if (closes.length < 50) {
    return 0;
  }

  const ema20 = calculateLatestEma(closes, 20);
  const ema50 = calculateLatestEma(closes, 50);

  if (ema50 === 0) {
    return 0;
  }

  const distance = (ema20 - ema50) / ema50;

  return clamp(distance * 40);
}

function calculateRsiScore(closes: number[]): number {
  const rsi = calculateWilderRsi(closes);

  if (rsi >= 50 && rsi <= 65) {
    return clamp((rsi - 50) / 15);
  }

  if (rsi > 65) {
    return clamp(1 - (rsi - 65) / 20);
  }

  if (rsi >= 35) {
    return clamp((rsi - 50) / 15);
  }

  return clamp(-1 + (rsi / 35) * 0.5);
}

function calculateVolumeScore(
  candles: AtlasCandle[]
): number {
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
    (latestCandle.volume - averageVolume) /
    averageVolume;

  const candleDirection =
    latestCandle.close > latestCandle.open
      ? 1
      : latestCandle.close < latestCandle.open
        ? -1
        : 0;

  return clamp(volumeDifference * candleDirection);
}

function calculateMomentum(closes: number[]): number {
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

export function calculateAtr(
  candles: AtlasCandle[],
  period = 14
): number {
  if (candles.length < period + 1) {
    return 0;
  }

  const validCandles = candles.filter(
    (candle) =>
      Number.isFinite(candle.high) &&
      Number.isFinite(candle.low) &&
      Number.isFinite(candle.close)
  );

  if (validCandles.length < period + 1) {
    return 0;
  }

  const trueRanges: number[] = [];

  for (let index = 1; index < validCandles.length; index += 1) {
    const currentCandle = validCandles[index];
    const previousCandle = validCandles[index - 1];

    const highLowRange =
      currentCandle.high - currentCandle.low;

    const highPreviousCloseRange = Math.abs(
      currentCandle.high - previousCandle.close
    );

    const lowPreviousCloseRange = Math.abs(
      currentCandle.low - previousCandle.close
    );

    trueRanges.push(
      Math.max(
        highLowRange,
        highPreviousCloseRange,
        lowPreviousCloseRange
      )
    );
  }

  const initialRanges = trueRanges.slice(0, period);

  let atr =
    initialRanges.reduce(
      (total, trueRange) => total + trueRange,
      0
    ) / period;

  for (
    let index = period;
    index < trueRanges.length;
    index += 1
  ) {
    atr =
      (atr * (period - 1) + trueRanges[index]) /
      period;
  }

  return atr;
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

  const closes = validCandles.map(
    (candle) => candle.close
  );

  return {
    trend: calculateTrend(closes),
    rsi: calculateRsiScore(closes),
    macd: calculateMacdScore(closes),
    volume: calculateVolumeScore(validCandles),
    momentum: calculateMomentum(closes),
  };
}