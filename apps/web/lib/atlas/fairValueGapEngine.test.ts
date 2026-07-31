import { describe, expect, it } from "vitest";

import {
  analyzeFairValueGaps,
  type AtlasCandle,
} from "./fairValueGapEngine";

describe("analyzeFairValueGaps", () => {
  it("detects an unfilled bullish fair value gap", () => {
    const candles: AtlasCandle[] = [
      { open: 95, high: 100, low: 90, close: 98 },
      { open: 99, high: 105, low: 98, close: 104 },
      { open: 112, high: 120, low: 110, close: 118 },
    ];

    const result = analyzeFairValueGaps(candles);

    expect(result.bullishFairValueGaps).toHaveLength(1);
    expect(result.bearishFairValueGaps).toHaveLength(0);

    const gap = result.bullishFairValueGaps[0];

    expect(gap.high).toBe(110);
    expect(gap.low).toBe(100);
    expect(gap.midpoint).toBe(105);
    expect(gap.filled).toBe(false);
    expect(gap.strength).toBe(100);

    expect(result.nearestBullishFairValueGap).toEqual(gap);
    expect(result.summary).toBe(
      "1 bullish and 0 bearish unfilled fair value gaps found."
    );
  });

  it("excludes a gap once price trades back through its midpoint", () => {
    const candles: AtlasCandle[] = [
      { open: 95, high: 100, low: 90, close: 98 },
      { open: 99, high: 105, low: 98, close: 104 },
      { open: 112, high: 120, low: 110, close: 118 },
      // Trades back through the gap's midpoint (105).
      { open: 118, high: 119, low: 95, close: 115 },
    ];

    const result = analyzeFairValueGaps(candles);

    expect(result.bullishFairValueGaps).toHaveLength(0);
    expect(result.nearestBullishFairValueGap).toBeNull();
  });
});
