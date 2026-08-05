export type PremiumDiscountZone =
  | "PREMIUM"
  | "DISCOUNT"
  | "EQUILIBRIUM";

export type PremiumDiscountResult = {
  zone: PremiumDiscountZone;
  rangeHigh: number | null;
  rangeLow: number | null;
  equilibrium: number | null;
  // Where price sits in the range: 0 = range low, 100 = range high.
  positionPercent: number;
};

type PdCandle = {
  high: number;
  low: number;
  close: number;
};

// Swing range lookback used as the dealing range.
const DEFAULT_LOOKBACK = 60;

// Band around the 50% equilibrium that counts as neutral.
const EQUILIBRIUM_BAND = 5;

function round(value: number): number {
  return Number(value.toFixed(8));
}

export function analyzePremiumDiscount(
  candles: readonly PdCandle[],
  lookback: number = DEFAULT_LOOKBACK
): PremiumDiscountResult {
  const price =
    candles.length > 0
      ? candles[candles.length - 1].close
      : 0;

  const window = candles.slice(-lookback);

  if (
    window.length === 0 ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return {
      zone: "EQUILIBRIUM",
      rangeHigh: null,
      rangeLow: null,
      equilibrium: null,
      positionPercent: 50,
    };
  }

  let rangeHigh = -Infinity;
  let rangeLow = Infinity;

  for (const candle of window) {
    rangeHigh = Math.max(rangeHigh, candle.high);
    rangeLow = Math.min(rangeLow, candle.low);
  }

  const range = rangeHigh - rangeLow;
  const equilibrium = (rangeHigh + rangeLow) / 2;

  if (!(range > 0)) {
    return {
      zone: "EQUILIBRIUM",
      rangeHigh: round(rangeHigh),
      rangeLow: round(rangeLow),
      equilibrium: round(equilibrium),
      positionPercent: 50,
    };
  }

  const positionPercent =
    ((price - rangeLow) / range) * 100;

  const zone: PremiumDiscountZone =
    positionPercent > 50 + EQUILIBRIUM_BAND
      ? "PREMIUM"
      : positionPercent < 50 - EQUILIBRIUM_BAND
      ? "DISCOUNT"
      : "EQUILIBRIUM";

  return {
    zone,
    rangeHigh: round(rangeHigh),
    rangeLow: round(rangeLow),
    equilibrium: round(equilibrium),
    positionPercent: Number(positionPercent.toFixed(2)),
  };
}
