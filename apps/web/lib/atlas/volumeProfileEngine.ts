export type VolumeProfileBias = "BULLISH" | "BEARISH" | "NEUTRAL";

export type VolumeProfileResult = {
  // Point of Control: the most-traded price over the window.
  poc: number | null;
  // Value area: the price range around the POC holding ~70% of volume.
  valueAreaHigh: number | null;
  valueAreaLow: number | null;
  bias: VolumeProfileBias;
  price: number;
  distancePercent: number;
};

type VpCandle = {
  high: number;
  low: number;
  close: number;
  volume: number;
};

const DEFAULT_LOOKBACK = 100;
const BINS = 24;
const NEUTRAL_BAND_PERCENT = 0.15;

function round(value: number): number {
  return Number(value.toFixed(8));
}

export function analyzeVolumeProfile(
  candles: readonly VpCandle[],
  lookback: number = DEFAULT_LOOKBACK
): VolumeProfileResult {
  const price =
    candles.length > 0
      ? candles[candles.length - 1].close
      : 0;

  const none: VolumeProfileResult = {
    poc: null,
    valueAreaHigh: null,
    valueAreaLow: null,
    bias: "NEUTRAL",
    price,
    distancePercent: 0,
  };

  const window = candles.slice(-lookback);

  if (
    window.length === 0 ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return none;
  }

  let rangeHigh = -Infinity;
  let rangeLow = Infinity;

  for (const candle of window) {
    rangeHigh = Math.max(rangeHigh, candle.high);
    rangeLow = Math.min(rangeLow, candle.low);
  }

  const range = rangeHigh - rangeLow;

  if (!(range > 0)) {
    return { ...none, poc: round(price) };
  }

  const bins = new Array<number>(BINS).fill(0);
  const binSize = range / BINS;

  for (const candle of window) {
    const typicalPrice =
      (candle.high + candle.low + candle.close) / 3;

    let index = Math.floor(
      (typicalPrice - rangeLow) / binSize
    );

    if (index < 0) {
      index = 0;
    }

    if (index >= BINS) {
      index = BINS - 1;
    }

    bins[index] += candle.volume;
  }

  const totalVolume = bins.reduce(
    (sum, value) => sum + value,
    0
  );

  if (totalVolume <= 0) {
    return none;
  }

  let pocIndex = 0;

  for (let i = 1; i < BINS; i++) {
    if (bins[i] > bins[pocIndex]) {
      pocIndex = i;
    }
  }

  const poc = rangeLow + (pocIndex + 0.5) * binSize;
  const distancePercent =
    ((price - poc) / poc) * 100;

  const bias: VolumeProfileBias =
    distancePercent > NEUTRAL_BAND_PERCENT
      ? "BULLISH"
      : distancePercent < -NEUTRAL_BAND_PERCENT
      ? "BEARISH"
      : "NEUTRAL";

  // Value area: expand out from the POC bin toward whichever adjacent bin
  // holds more volume until ~70% of total volume is covered.
  const targetVolume = totalVolume * 0.7;
  let low = pocIndex;
  let high = pocIndex;
  let covered = bins[pocIndex];

  while (
    covered < targetVolume &&
    (low > 0 || high < BINS - 1)
  ) {
    const below = low > 0 ? bins[low - 1] : -1;
    const above = high < BINS - 1 ? bins[high + 1] : -1;

    if (above >= below) {
      high += 1;
      covered += above;
    } else {
      low -= 1;
      covered += below;
    }
  }

  return {
    poc: round(poc),
    valueAreaHigh: round(rangeLow + (high + 1) * binSize),
    valueAreaLow: round(rangeLow + low * binSize),
    bias,
    price,
    distancePercent: Number(distancePercent.toFixed(2)),
  };
}
