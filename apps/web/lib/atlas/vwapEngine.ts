export type VwapBias = "BULLISH" | "BEARISH" | "NEUTRAL";

export type VwapResult = {
  // Volume-weighted average price over the lookback window (null if it
  // can't be computed, e.g. missing volume).
  vwap: number | null;
  price: number;
  bias: VwapBias;
  // Signed distance of price from VWAP, in percent.
  distancePercent: number;
};

type VwapCandle = {
  high: number;
  low: number;
  close: number;
  volume: number;
};

// On the 1h timeframe, 24 candles ≈ one trading day — a rolling proxy for
// the daily VWAP without needing candle timestamps.
const DEFAULT_LOOKBACK = 24;

// Price within this band of VWAP counts as neutral rather than a bias.
const NEUTRAL_BAND_PERCENT = 0.1;

export function analyzeVwap(
  candles: readonly VwapCandle[],
  lookback: number = DEFAULT_LOOKBACK
): VwapResult {
  const price =
    candles.length > 0
      ? candles[candles.length - 1].close
      : 0;

  const window = candles.slice(-lookback);

  let cumulativeTypicalVolume = 0;
  let cumulativeVolume = 0;

  for (const candle of window) {
    const typicalPrice =
      (candle.high + candle.low + candle.close) / 3;

    cumulativeTypicalVolume += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
  }

  if (
    window.length === 0 ||
    cumulativeVolume <= 0 ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return {
      vwap: null,
      price,
      bias: "NEUTRAL",
      distancePercent: 0,
    };
  }

  const vwap = cumulativeTypicalVolume / cumulativeVolume;
  const distancePercent =
    ((price - vwap) / vwap) * 100;

  const bias: VwapBias =
    distancePercent > NEUTRAL_BAND_PERCENT
      ? "BULLISH"
      : distancePercent < -NEUTRAL_BAND_PERCENT
      ? "BEARISH"
      : "NEUTRAL";

  return {
    vwap: Number(vwap.toFixed(8)),
    price,
    bias,
    distancePercent: Number(distancePercent.toFixed(2)),
  };
}
