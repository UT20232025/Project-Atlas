import { describe, expect, it } from "vitest";

import { analyzeMarketStructure } from "./marketStructureEngine";
import type { AtlasCandle } from "./atlasIndicators";

function candle(
  high: number,
  low: number
): AtlasCandle {
  return {
    open: (high + low) / 2,
    high,
    low,
    close: (high + low) / 2,
    volume: 100,
  };
}

describe("analyzeMarketStructure", () => {
  it("reports insufficient data under 20 candles", () => {
    const result = analyzeMarketStructure([
      candle(100, 90),
      candle(101, 91),
    ]);

    expect(result.trend).toBe("RANGING");
    expect(result.event).toBe("NONE");
    expect(result.explanation).toEqual([
      { code: "MARKET_STRUCTURE_INSUFFICIENT_DATA" },
    ]);
  });

  it("detects a bullish break of structure from higher highs and higher lows", () => {
    // Highs: two swing highs (108, then 111) -> HIGHER_HIGH.
    const highs = [
      100, 104, 108, 104, 100, 96, 92, 96, 100, 104,
      111, 104, 100, 96, 92, 96, 100, 104, 108, 120,
    ];

    // Lows: two swing lows (85, then 90) -> HIGHER_LOW.
    const lows = [
      90, 94, 98, 94, 90, 87, 85, 87, 90, 94,
      98, 94, 92, 94, 90, 94, 98, 94, 102, 110,
    ];

    const candles: AtlasCandle[] = highs.map(
      (high, index) => candle(high, lows[index])
    );

    // Only the final candle's close matters for the break check.
    candles[candles.length - 1] = {
      ...candles[candles.length - 1],
      close: 118,
    };

    const result = analyzeMarketStructure(candles);

    expect(result.swingHighType).toBe("HIGHER_HIGH");
    expect(result.swingLowType).toBe("HIGHER_LOW");
    expect(result.trend).toBe("BULLISH");
    expect(result.latestSwingHigh).toBe(111);
    expect(result.previousSwingHigh).toBe(108);
    expect(result.latestSwingLow).toBe(90);
    expect(result.previousSwingLow).toBe(85);
    expect(result.bullishBreak).toBe(true);
    expect(result.bearishBreak).toBe(false);
    expect(result.event).toBe("BOS_BULLISH");
    expect(result.strength).toBe(85);
    expect(result.confidence).toBe(89);
  });
});
