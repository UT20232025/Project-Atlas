import { describe, expect, it } from "vitest";

import { analyzeRsiDivergence } from "@/lib/atlas/rsiDivergenceEngine";

function ramp(from: number, to: number, n: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    values.push(from + ((to - from) * i) / (n - 1));
  }
  return values;
}

function toCandles(closes: number[]) {
  return closes.map((close) => ({
    high: close + 1,
    low: close - 1,
    close,
  }));
}

describe("analyzeRsiDivergence", () => {
  it("detects bullish divergence (lower low, higher RSI)", () => {
    // Steep first drop to a low (very low RSI), recovery, then a gentle
    // drift to a lower low (RSI recovers) → bullish divergence.
    const closes = [
      ...Array(15).fill(100),
      ...ramp(100, 70, 16),
      ...ramp(70, 88, 10),
      ...ramp(88, 68, 12),
    ];

    const result = analyzeRsiDivergence(toCandles(closes));

    expect(result.divergence).toBe("BULLISH");
  });

  it("detects bearish divergence (higher high, lower RSI)", () => {
    const closes = [
      ...Array(15).fill(100),
      ...ramp(100, 130, 16),
      ...ramp(130, 112, 10),
      ...ramp(112, 132, 12),
    ];

    const result = analyzeRsiDivergence(toCandles(closes));

    expect(result.divergence).toBe("BEARISH");
  });

  it("returns NONE in a flat market", () => {
    const result = analyzeRsiDivergence(
      toCandles(Array(50).fill(100))
    );

    expect(result.divergence).toBe("NONE");
  });

  it("returns NONE with too few candles", () => {
    const result = analyzeRsiDivergence(
      toCandles(ramp(100, 90, 10))
    );

    expect(result.divergence).toBe("NONE");
  });
});
