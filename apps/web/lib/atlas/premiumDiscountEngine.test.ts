import { describe, expect, it } from "vitest";

import { analyzePremiumDiscount } from "@/lib/atlas/premiumDiscountEngine";

function candle(high: number, low: number, close: number) {
  return { high, low, close };
}

describe("analyzePremiumDiscount", () => {
  it("marks price near the range low as DISCOUNT", () => {
    const candles = [
      candle(100, 0, 50),
      candle(100, 0, 50),
      candle(20, 5, 10),
    ];

    const result = analyzePremiumDiscount(candles);

    expect(result.zone).toBe("DISCOUNT");
    expect(result.positionPercent).toBeLessThan(45);
  });

  it("marks price near the range high as PREMIUM", () => {
    const candles = [
      candle(100, 0, 50),
      candle(100, 0, 50),
      candle(98, 90, 95),
    ];

    const result = analyzePremiumDiscount(candles);

    expect(result.zone).toBe("PREMIUM");
    expect(result.positionPercent).toBeGreaterThan(55);
  });

  it("marks price at the midpoint as EQUILIBRIUM", () => {
    const candles = [
      candle(100, 0, 50),
      candle(100, 0, 50),
      candle(60, 40, 50),
    ];

    const result = analyzePremiumDiscount(candles);

    expect(result.zone).toBe("EQUILIBRIUM");
  });

  it("computes the range and equilibrium", () => {
    const candles = [
      candle(100, 20, 60),
      candle(90, 40, 60),
    ];

    const result = analyzePremiumDiscount(candles);

    expect(result.rangeHigh).toBe(100);
    expect(result.rangeLow).toBe(20);
    expect(result.equilibrium).toBe(60);
  });

  it("is neutral with no candles", () => {
    const result = analyzePremiumDiscount([]);

    expect(result.zone).toBe("EQUILIBRIUM");
    expect(result.rangeHigh).toBeNull();
  });
});
