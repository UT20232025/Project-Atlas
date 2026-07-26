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

export type AtlasTrendStatus =
  | "STRONG_BULLISH"
  | "BULLISH"
  | "SIDEWAYS"
  | "BEARISH"
  | "STRONG_BEARISH";

export type AtlasIndicatorResult = AtlasMarketInput & {
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  trendStatus: AtlasTrendStatus;
};

function clamp(
  value: number,
  minimum = -1,
  maximum = 1
): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function getLatestEma(
  closes: number[],
  period: number
): number | null {
  if (closes.length < period) {
    return null;
  }

  const ema = calculateLatestEma(closes, period);

  if (!Number.isFinite(ema) || ema <= 0) {
    return null;
  }

  return ema;
}

function calculateTrendScore(
  closes: number[],
  ema20: number | null,
  ema50: number | null,
  ema200: number | null
): number {
  const latestClose = closes.at(-1);

  if (
    latestClose === undefined ||
    !Number.isFinite(latestClose) ||
    ema20 === null ||
    ema50 === null
  ) {
    return 0;
  }

  const emaDistance =
    ema50 === 0 ? 0 : (ema20 - ema50) / ema50;

  const priceDistance =
    ema20 === 0 ? 0 : (latestClose - ema20) / ema20;

  let score =
    emaDistance * 35 +
    priceDistance * 15;

  if (ema200 !== null) {
    if (
      latestClose > ema200 &&
      ema20 > ema50 &&
      ema50 > ema200
    ) {
      score += 0.25;
    } else if (
      latestClose < ema200 &&
      ema20 < ema50 &&
      ema50 < ema200
    ) {
      score -= 0.25;
    } else if (latestClose > ema200) {
      score += 0.1;
    } else if (latestClose < ema200) {
      score -= 0.1;
    }
  }

  return clamp(score);
}

function determineTrendStatus(
  closes: number[],
  ema20: number | null,
  ema50: number | null,
  ema200: number | null
): AtlasTrendStatus {
  const latestClose = closes.at(-1);

  if (
    latestClose === undefined ||
    ema20 === null ||
    ema50 === null
  ) {
    return "SIDEWAYS";
  }

  const emaDistance =
    Math.abs(ema20 - ema50) / ema50;

  const sidewaysThreshold = 0.0015;

  if (
    emaDistance < sidewaysThreshold &&
    Math.abs(latestClose - ema20) / ema20 <
      sidewaysThreshold * 2
  ) {
    return "SIDEWAYS";
  }

  const bullishStructure =
    latestClose > ema20 &&
    ema20 > ema50;

  const bearishStructure =
    latestClose < ema20 &&
    ema20 < ema50;

  if (ema200 !== null) {
    if (
      bullishStructure &&
      ema50 > ema200 &&
      latestClose > ema200
    ) {
      return "STRONG_BULLISH";
    }

    if (
      bearishStructure &&
      ema50 < ema200 &&
      latestClose < ema200
    ) {
      return "STRONG_BEARISH";
    }
  }

  if (bullishStructure) {
    return "BULLISH";
  }

  if (bearishStructure) {
    return "BEARISH";
  }

  return "SIDEWAYS";
}

function calculateRsiScore(closes: number[]): number {
  const rsi = calculateWilderRsi(closes);

  if (!Number.isFinite(rsi)) {
    return 0;
  }

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

  if (previousCandles.length === 0) {
    return 0;
  }

  const averageVolume =
    previousCandles.reduce(
      (total, candle) => total + candle.volume,
      0
    ) / previousCandles.length;

  if (
    !Number.isFinite(averageVolume) ||
    averageVolume <= 0
  ) {
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

  return clamp(
    volumeDifference * candleDirection
  );
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
    (latestClose - previousClose) /
    previousClose;

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

  for (
    let index = 1;
    index < validCandles.length;
    index += 1
  ) {
    const currentCandle = validCandles[index];
    const previousCandle =
      validCandles[index - 1];

    const highLowRange =
      currentCandle.high - currentCandle.low;

    const highPreviousCloseRange = Math.abs(
      currentCandle.high -
        previousCandle.close
    );

    const lowPreviousCloseRange = Math.abs(
      currentCandle.low -
        previousCandle.close
    );

    trueRanges.push(
      Math.max(
        highLowRange,
        highPreviousCloseRange,
        lowPreviousCloseRange
      )
    );
  }

  const initialRanges = trueRanges.slice(
    0,
    period
  );

  let atr =
    initialRanges.reduce(
      (total, trueRange) =>
        total + trueRange,
      0
    ) / period;

  for (
    let index = period;
    index < trueRanges.length;
    index += 1
  ) {
    atr =
      (atr * (period - 1) +
        trueRanges[index]) /
      period;
  }

  return Number.isFinite(atr) ? atr : 0;
}

export function calculateAtlasIndicators(
  candles: AtlasCandle[]
): AtlasIndicatorResult {
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

  const ema20 = getLatestEma(closes, 20);
  const ema50 = getLatestEma(closes, 50);
  const ema200 = getLatestEma(closes, 200);

  const trendStatus = determineTrendStatus(
    closes,
    ema20,
    ema50,
    ema200
  );

  return {
    trend: calculateTrendScore(
      closes,
      ema20,
      ema50,
      ema200
    ),
    rsi: calculateRsiScore(closes),
    macd: calculateMacdScore(closes),
    volume:
      calculateVolumeScore(validCandles),
    momentum: calculateMomentum(closes),
    ema20,
    ema50,
    ema200,
    trendStatus,
  };
}