import type { AtlasCandle } from "@/lib/atlas/atlasTypes";

// A momentum/breakout detector that runs ALONGSIDE the conservative MTF engine.
// The core engine waits for 1h/4h agreement, which is exactly when a fast
// breakout is missed (the fast timeframe surges while the slow one lags, so they
// "disagree" and it sits on WAIT). This looks for the expansion itself — an
// unusually large, decisive candle that breaks the recent range on a volume
// surge — so Atlas can flag "🚀 breakout happening now" as it fires, not after.
// Deliberately separate from decision.signal so it never pollutes the verified
// (conservative) track record.

export type BreakoutResult = {
  detected: boolean;
  direction: "LONG" | "SHORT" | null;
  strength: number; // 0-100
  reasons: string[];
  rangeExpansion: number; // latest candle range ÷ recent average range
  volumeSurge: number | null; // latest volume ÷ recent average (null: no volume, e.g. FX)
  // Volatility is contracting (recent candles much tighter than the baseline) —
  // a coil that often precedes a breakout. Shown as "⚡ charging up".
  coiling: boolean;
  // Trade levels for a detected breakout, so it can be sent as a full signal
  // (entry/SL/TP) like the conservative one. Null when not detected.
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskReward: number | null;
};

export type BreakoutConfig = {
  enabled: boolean;
  lookback: number;
  minRangeExpansion: number;
  minVolumeSurge: number;
  minBodyRatio: number;
  coilRatio: number; // recent-5 avg range ÷ baseline below this = coiling
  riskReward: number; // take-profit distance ÷ stop distance
};

function numEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) ? raw : fallback;
}

export function getBreakoutConfig(): BreakoutConfig {
  return {
    enabled: process.env.ATLAS_BREAKOUT !== "off",
    lookback: numEnv("ATLAS_BREAKOUT_LOOKBACK", 20),
    minRangeExpansion: numEnv("ATLAS_BREAKOUT_MIN_EXPANSION", 2.2),
    minVolumeSurge: numEnv("ATLAS_BREAKOUT_MIN_VOLUME", 2),
    minBodyRatio: numEnv("ATLAS_BREAKOUT_MIN_BODY", 0.6),
    coilRatio: numEnv("ATLAS_BREAKOUT_COIL_RATIO", 0.6),
    riskReward: numEnv("ATLAS_BREAKOUT_RR", 2),
  };
}

const EMPTY: BreakoutResult = {
  detected: false,
  direction: null,
  strength: 0,
  reasons: [],
  rangeExpansion: 0,
  volumeSurge: null,
  coiling: false,
  entry: null,
  stopLoss: null,
  takeProfit: null,
  riskReward: null,
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function detectBreakout(
  candles: AtlasCandle[],
  config: BreakoutConfig = getBreakoutConfig()
): BreakoutResult {
  if (!config.enabled) return EMPTY;

  const n = config.lookback;
  if (candles.length < n + 2) return EMPTY;

  const last = candles[candles.length - 1];
  // The n candles just before the latest — the "normal" baseline it breaks out of.
  const recent = candles.slice(-(n + 1), -1);

  const avgRange = mean(recent.map((c) => c.high - c.low));
  if (avgRange <= 0) return EMPTY;

  // Coiling: the most recent stretch is much tighter than the baseline.
  const shortRange = mean(
    recent.slice(-5).map((c) => c.high - c.low)
  );
  const coiling = shortRange < config.coilRatio * avgRange;

  const lastRange = last.high - last.low;
  const lastBody = Math.abs(last.close - last.open);
  const bullish = last.close >= last.open;

  const rangeExpansion = lastRange / avgRange;
  const bodyRatio = lastRange > 0 ? lastBody / lastRange : 0;

  const recentHigh = Math.max(...recent.map((c) => c.high));
  const recentLow = Math.min(...recent.map((c) => c.low));
  const brokeRange = bullish
    ? last.close > recentHigh
    : last.close < recentLow;

  // Volume is a bonus, not a requirement — FX candles carry no real volume.
  const avgVolume = mean(recent.map((c) => c.volume));
  const volumeSurge = avgVolume > 0 ? last.volume / avgVolume : null;
  const volumeOk =
    volumeSurge === null || volumeSurge >= config.minVolumeSurge;

  const detected =
    rangeExpansion >= config.minRangeExpansion &&
    bodyRatio >= config.minBodyRatio &&
    brokeRange &&
    volumeOk;

  if (!detected) {
    return { ...EMPTY, rangeExpansion, volumeSurge, coiling };
  }

  const reasons = ["RANGE_EXPANSION"];
  if (volumeSurge !== null && volumeSurge >= config.minVolumeSurge) {
    reasons.push("VOLUME_SURGE");
  }
  reasons.push(bullish ? "BROKE_RANGE_HIGH" : "BROKE_RANGE_LOW");

  const expansionScore = Math.min(
    1,
    (rangeExpansion - config.minRangeExpansion) / 3 + 0.4
  );
  const volumeScore =
    volumeSurge === null
      ? 0.5
      : Math.min(1, (volumeSurge - config.minVolumeSurge) / 3 + 0.4);
  const strength = Math.round(
    Math.min(100, 100 * (0.6 * expansionScore + 0.4 * volumeScore))
  );

  // Trade levels: enter at the breakout close, invalidate at roughly the middle
  // of the breakout candle (a fall back into it means the break failed), target
  // at the configured R multiple.
  const entry = last.close;
  const risk = 0.5 * lastRange;
  const stopLoss = bullish ? entry - risk : entry + risk;
  const takeProfit = bullish
    ? entry + config.riskReward * risk
    : entry - config.riskReward * risk;

  return {
    detected: true,
    direction: bullish ? "LONG" : "SHORT",
    strength,
    reasons,
    rangeExpansion,
    volumeSurge,
    coiling: false,
    entry,
    stopLoss,
    takeProfit,
    riskReward: config.riskReward,
  };
}
