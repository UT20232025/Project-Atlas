import { describe, expect, it } from "vitest";

import { analyzeMarket } from "./atlasEngine";

describe("analyzeMarket", () => {
  it("scores a fully neutral market as NEUTRAL with high risk", () => {
    const result = analyzeMarket({
      trend: 0,
      rsi: 0,
      macd: 0,
      volume: 0,
      momentum: 0,
    });

    expect(result.score).toBe(51);
    expect(result.signal).toBe("NEUTRAL");
    expect(result.risk).toBe("HIGH");
    expect(result.factors).toHaveLength(5);
  });

  it("scores a fully bullish market as STRONG_LONG with low risk", () => {
    const result = analyzeMarket({
      trend: 1,
      rsi: 1,
      macd: 1,
      volume: 1,
      momentum: 1,
    });

    expect(result.score).toBe(100);
    expect(result.signal).toBe("STRONG_LONG");
    expect(result.confidence).toBe(100);
    expect(result.risk).toBe("LOW");
    expect(
      result.factors.every((factor) => factor.status === "BULLISH")
    ).toBe(true);
  });

  it("scores a fully bearish market as STRONG_SHORT with low risk", () => {
    const result = analyzeMarket({
      trend: -1,
      rsi: -1,
      macd: -1,
      volume: -1,
      momentum: -1,
    });

    expect(result.score).toBe(0);
    expect(result.signal).toBe("STRONG_SHORT");
    expect(result.risk).toBe("LOW");
    expect(
      result.factors.every((factor) => factor.status === "BEARISH")
    ).toBe(true);
  });
});
