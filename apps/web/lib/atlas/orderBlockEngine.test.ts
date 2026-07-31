import { describe, expect, it } from "vitest";

import { analyzeOrderBlocks, type AtlasCandle } from "./orderBlockEngine";

describe("analyzeOrderBlocks", () => {
  it("reports no data when fewer than 3 candles are given", () => {
    const candles: AtlasCandle[] = [
      { open: 100, high: 101, low: 99, close: 100 },
      { open: 100, high: 101, low: 99, close: 100 },
    ];

    const result = analyzeOrderBlocks(candles);

    expect(result.bullishOrderBlocks).toEqual([]);
    expect(result.bearishOrderBlocks).toEqual([]);
    expect(result.summary).toBe(
      "Not enough candle data to detect order blocks."
    );
  });

  it("detects an active, unmitigated bullish order block", () => {
    const candles: AtlasCandle[] = [
      // Bearish order block candle.
      { open: 110, high: 112, low: 98, close: 100 },
      // Bullish impulse that displaces above the order block candle's high.
      { open: 115, high: 130, low: 115, close: 125 },
      // Later candle that doesn't retrace into the zone.
      { open: 125, high: 135, low: 120, close: 130 },
    ];

    const result = analyzeOrderBlocks(candles);

    expect(result.bullishOrderBlocks).toHaveLength(1);
    expect(result.bearishOrderBlocks).toHaveLength(0);

    const zone = result.bullishOrderBlocks[0];

    expect(zone.high).toBe(110);
    expect(zone.low).toBe(98);
    expect(zone.midpoint).toBe(104);
    expect(zone.mitigated).toBe(false);
    expect(zone.strength).toBe(58);

    expect(result.nearestBullishOrderBlock).toEqual(zone);
    expect(result.nearestBearishOrderBlock).toBeNull();
  });

  it("marks a bullish order block as mitigated once price trades back into it", () => {
    const candles: AtlasCandle[] = [
      { open: 110, high: 112, low: 98, close: 100 },
      { open: 115, high: 130, low: 115, close: 125 },
      // Retraces back into the order block zone (98-110).
      { open: 125, high: 126, low: 105, close: 108 },
    ];

    const result = analyzeOrderBlocks(candles);

    expect(result.bullishOrderBlocks[0].mitigated).toBe(true);
    expect(result.nearestBullishOrderBlock).toBeNull();
  });
});
