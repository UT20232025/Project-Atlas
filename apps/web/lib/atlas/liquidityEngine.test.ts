import { describe, expect, it } from "vitest";

import { analyzeLiquidity } from "./liquidityEngine";
import type { AtlasCandle } from "./atlasIndicators";

function candle(
  open: number,
  high: number,
  low: number,
  close: number
): AtlasCandle {
  return { open, high, low, close, volume: 100 };
}

describe("analyzeLiquidity", () => {
  it("reports insufficient data for a short candle series", () => {
    const result = analyzeLiquidity([
      candle(100, 101, 99, 100),
      candle(100, 101, 99, 100),
    ]);

    expect(result.equalHighs).toBe(false);
    expect(result.equalLows).toBe(false);
    expect(result.explanation).toBe(
      "Not enough candle data to analyze liquidity."
    );
  });

  it("detects equal highs and a bearish liquidity sweep", () => {
    // Two swing highs at the same level (110) form a liquidity pool
    // (equal highs). Candle 12 sweeps above it and closes back below.
    const candles: AtlasCandle[] = [
      candle(97, 100, 95, 98), // 0
      candle(101, 105, 100, 103), // 1
      candle(106, 110, 105, 108), // 2 swing high #1 (110)
      candle(103, 105, 100, 101), // 3
      candle(95, 100, 90, 92), // 4
      candle(90, 95, 88, 89), // 5
      candle(88, 100, 85, 90), // 6
      candle(101, 105, 100, 103), // 7
      candle(106, 110, 105, 108), // 8 swing high #2 (110)
      candle(103, 105, 100, 101), // 9
      candle(85, 100, 80, 90), // 10
      candle(91, 95, 90, 92), // 11
      candle(96, 130, 94, 98), // 12 bearish sweep candle
      candle(95, 100, 94, 98), // 13
    ];

    const result = analyzeLiquidity(candles);

    expect(result.equalHighs).toBe(true);
    expect(result.equalLows).toBe(false);
    expect(result.liquidityAbove).toBe(110);
    expect(result.liquidityBelow).toBeNull();

    expect(result.bearishSweep).toBe(true);
    expect(result.bullishSweep).toBe(false);
    expect(result.sweepDirection).toBe("BEARISH");
    expect(result.sweepLevel).toBe(110);
    expect(result.sweepCandleIndex).toBe(12);
    expect(result.confidence).toBe(81);

    expect(result.explanation).toBe(
      "Bearish liquidity sweep detected above equal highs. Price traded above the liquidity level and closed back below it."
    );
  });
});
