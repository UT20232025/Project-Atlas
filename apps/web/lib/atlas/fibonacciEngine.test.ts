import { describe, expect, it } from "vitest";

import { analyzeFibonacci } from "@/lib/atlas/fibonacciEngine";

function candle(high: number, low: number, close: number) {
  return { high, low, close };
}

describe("analyzeFibonacci", () => {
  it("flags a bullish golden-pocket retest after an up leg", () => {
    // Low first, then high (last leg up), then price pulls back into the
    // 0.618–0.786 band of a 0→100 range (≈21.4–38.2).
    const candles = [
      candle(10, 0, 5),
      candle(100, 90, 100),
      candle(31, 29, 30),
    ];

    const result = analyzeFibonacci(candles);

    expect(result.direction).toBe("BULLISH");
    expect(result.inGoldenPocket).toBe(true);
    expect(result.swingHigh).toBe(100);
    expect(result.swingLow).toBe(0);
  });

  it("flags a bearish golden-pocket retest after a down leg", () => {
    // High first, then low (last leg down), then price rallies into the
    // 0.618–0.786 band measured up from the low (≈61.8–78.6).
    const candles = [
      candle(100, 90, 95),
      candle(10, 0, 2),
      candle(71, 69, 70),
    ];

    const result = analyzeFibonacci(candles);

    expect(result.direction).toBe("BEARISH");
    expect(result.inGoldenPocket).toBe(true);
  });

  it("returns NONE when price is outside the golden pocket", () => {
    const candles = [
      candle(10, 0, 5),
      candle(100, 90, 100),
      candle(95, 93, 94),
    ];

    const result = analyzeFibonacci(candles);

    expect(result.inGoldenPocket).toBe(false);
    expect(result.direction).toBe("NONE");
  });

  it("is empty with no candles", () => {
    const result = analyzeFibonacci([]);

    expect(result.direction).toBe("NONE");
    expect(result.swingHigh).toBeNull();
  });
});
