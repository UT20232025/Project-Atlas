import { describe, expect, it } from "vitest";

import type { AtlasCandle } from "@/lib/atlas/atlasTypes";
import {
  detectBreakout,
  type BreakoutConfig,
} from "@/lib/atlas/breakoutEngine";

const config: BreakoutConfig = {
  enabled: true,
  lookback: 20,
  minRangeExpansion: 2.2,
  minVolumeSurge: 2,
  minBodyRatio: 0.6,
};

// A calm baseline: 22 tight candles oscillating in a narrow range.
function baseline(): AtlasCandle[] {
  const candles: AtlasCandle[] = [];
  for (let i = 0; i < 22; i++) {
    const base = 100 + (i % 2 === 0 ? 0 : 1);
    candles.push({
      open: base,
      high: base + 1,
      low: base - 1,
      close: base + (i % 2 === 0 ? 0.5 : -0.5),
      volume: 1000,
    });
  }
  return candles;
}

describe("detectBreakout", () => {
  it("stays quiet on a calm, range-bound tape", () => {
    const result = detectBreakout(baseline(), config);
    expect(result.detected).toBe(false);
    expect(result.direction).toBeNull();
  });

  it("fires LONG on a large bullish expansion candle breaking the range on volume", () => {
    const candles = baseline();
    // A decisive green rocket: ~10x range, closes well above the recent high,
    // big body, huge volume.
    candles.push({
      open: 101,
      high: 121,
      low: 100.5,
      close: 120,
      volume: 6000,
    });

    const result = detectBreakout(candles, config);
    expect(result.detected).toBe(true);
    expect(result.direction).toBe("LONG");
    expect(result.strength).toBeGreaterThan(0);
    expect(result.reasons).toContain("BROKE_RANGE_HIGH");
    expect(result.reasons).toContain("VOLUME_SURGE");
  });

  it("fires SHORT on a large bearish breakdown", () => {
    const candles = baseline();
    candles.push({
      open: 100,
      high: 100.5,
      low: 80,
      close: 81,
      volume: 6000,
    });

    const result = detectBreakout(candles, config);
    expect(result.detected).toBe(true);
    expect(result.direction).toBe("SHORT");
    expect(result.reasons).toContain("BROKE_RANGE_LOW");
  });

  it("does not fire on a big-range candle that is mostly wick (indecisive)", () => {
    const candles = baseline();
    // Wide range but tiny body — a rejection wick, not a breakout.
    candles.push({
      open: 100,
      high: 120,
      low: 99,
      close: 100.5,
      volume: 6000,
    });

    const result = detectBreakout(candles, config);
    expect(result.detected).toBe(false);
  });

  it("still fires without volume data (e.g. FX) when the expansion is clear", () => {
    const candles = baseline().map((c) => ({ ...c, volume: 0 }));
    candles.push({
      open: 101,
      high: 121,
      low: 100.5,
      close: 120,
      volume: 0,
    });

    const result = detectBreakout(candles, config);
    expect(result.detected).toBe(true);
    expect(result.direction).toBe("LONG");
    expect(result.volumeSurge).toBeNull();
  });
});
