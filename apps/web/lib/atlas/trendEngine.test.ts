import { describe, expect, it } from "vitest";

import { analyzeTrend } from "./trendEngine";
import type { AtlasIndicatorResult } from "./atlasIndicators";

function buildIndicators(
  overrides: Partial<AtlasIndicatorResult>
): AtlasIndicatorResult {
  return {
    trend: 0,
    rsi: 0,
    macd: 0,
    volume: 0,
    momentum: 0,
    ema20: null,
    ema50: null,
    ema200: null,
    trendStatus: "SIDEWAYS",
    rawRsi: 50,
    ...overrides,
  };
}

describe("analyzeTrend", () => {
  it("reports maximum strength for a full bullish EMA stack", () => {
    const result = analyzeTrend(
      buildIndicators({
        ema20: 110,
        ema50: 105,
        ema200: 100,
        trendStatus: "STRONG_BULLISH",
      })
    );

    expect(result.direction).toBe("STRONG_BULLISH");
    expect(result.strength).toBe(95);
    expect(result.confidence).toBe(95);
    expect(result.explanation).toBe(
      "Strong bullish trend across EMA20, EMA50 and EMA200."
    );
  });

  it("reports maximum strength for a full bearish EMA stack", () => {
    const result = analyzeTrend(
      buildIndicators({
        ema20: 95,
        ema50: 100,
        ema200: 105,
        trendStatus: "STRONG_BEARISH",
      })
    );

    expect(result.direction).toBe("STRONG_BEARISH");
    expect(result.strength).toBe(95);
  });

  it("caps strength at 55 when the trend status is SIDEWAYS, even with a bullish EMA stack", () => {
    const result = analyzeTrend(
      buildIndicators({
        ema20: 110,
        ema50: 105,
        ema200: 100,
        trendStatus: "SIDEWAYS",
      })
    );

    expect(result.strength).toBe(55);
    expect(result.explanation).toBe(
      "Market is ranging without a clear directional trend."
    );
  });

  it("falls back to low strength when no EMA data is available", () => {
    const result = analyzeTrend(
      buildIndicators({
        ema20: null,
        ema50: null,
        ema200: null,
        trendStatus: "BULLISH",
      })
    );

    expect(result.strength).toBe(40);
    expect(result.explanation).toBe(
      "Bullish trend detected with limited EMA history."
    );
  });
});
