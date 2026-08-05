import { describe, expect, it } from "vitest";

import { analyzeVwap } from "@/lib/atlas/vwapEngine";

function candle(price: number, volume = 100) {
  return { high: price, low: price, close: price, volume };
}

describe("analyzeVwap", () => {
  it("returns BULLISH when price is clearly above the VWAP", () => {
    const candles = [
      ...Array.from({ length: 10 }, () => candle(100)),
      candle(120),
    ];

    const result = analyzeVwap(candles);

    expect(result.vwap).not.toBeNull();
    expect(result.bias).toBe("BULLISH");
    expect(result.distancePercent).toBeGreaterThan(0);
  });

  it("returns BEARISH when price is clearly below the VWAP", () => {
    const candles = [
      ...Array.from({ length: 10 }, () => candle(100)),
      candle(80),
    ];

    const result = analyzeVwap(candles);

    expect(result.bias).toBe("BEARISH");
    expect(result.distancePercent).toBeLessThan(0);
  });

  it("returns NEUTRAL when price sits on the VWAP", () => {
    const candles = Array.from({ length: 24 }, () =>
      candle(100)
    );

    const result = analyzeVwap(candles);

    expect(result.bias).toBe("NEUTRAL");
  });

  it("weights VWAP toward high-volume candles", () => {
    // Heavy volume at 100, a light candle at 200 → VWAP stays near 100.
    const candles = [
      candle(100, 1000),
      candle(100, 1000),
      candle(200, 1),
    ];

    const result = analyzeVwap(candles);

    expect(result.vwap).not.toBeNull();
    expect(result.vwap as number).toBeLessThan(105);
  });

  it("returns a null VWAP when there is no volume", () => {
    const candles = Array.from({ length: 5 }, () =>
      candle(100, 0)
    );

    const result = analyzeVwap(candles);

    expect(result.vwap).toBeNull();
    expect(result.bias).toBe("NEUTRAL");
  });
});
