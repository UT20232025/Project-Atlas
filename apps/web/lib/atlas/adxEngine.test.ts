import { describe, expect, it } from "vitest";

import { analyzeAdx } from "@/lib/atlas/adxEngine";

function trend(step: number, count = 40) {
  const candles = [];
  let close = 100;

  for (let i = 0; i < count; i++) {
    close += step;
    candles.push({
      high: close + 1,
      low: close - 1,
      close,
    });
  }

  return candles;
}

describe("analyzeAdx", () => {
  it("detects a strong bullish trend", () => {
    const result = analyzeAdx(trend(2));

    expect(result.adx).not.toBeNull();
    expect(result.trend).toBe("BULLISH");
    expect(result.adx as number).toBeGreaterThanOrEqual(25);
    expect((result.plusDi as number)).toBeGreaterThan(
      result.minusDi as number
    );
  });

  it("detects a strong bearish trend", () => {
    const result = analyzeAdx(trend(-2));

    expect(result.trend).toBe("BEARISH");
    expect((result.minusDi as number)).toBeGreaterThan(
      result.plusDi as number
    );
  });

  it("reports no directional trend in a flat market", () => {
    const flat = Array.from({ length: 40 }, () => ({
      high: 101,
      low: 99,
      close: 100,
    }));

    const result = analyzeAdx(flat);

    expect(result.trend).toBe("NONE");
    expect(result.adx as number).toBeLessThan(25);
  });

  it("returns null with too few candles", () => {
    const result = analyzeAdx(trend(1, 10));

    expect(result.adx).toBeNull();
    expect(result.trend).toBe("NONE");
  });
});
