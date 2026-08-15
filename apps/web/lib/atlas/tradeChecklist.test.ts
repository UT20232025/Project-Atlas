import { describe, expect, it } from "vitest";

import type { AtlasMtfResult } from "@/lib/atlas/multiTimeframeEngine";
import type { LiquidityResult } from "@/lib/atlas/liquidityEngine";
import type { PriceActionResult } from "@/lib/atlas/priceActionEngine";
import { buildTradeChecklist } from "@/lib/atlas/tradeChecklist";

function mtf(over: Partial<AtlasMtfResult> = {}): AtlasMtfResult {
  return {
    signal: "NEUTRAL",
    confidence: 0,
    agreement: 0,
    aligned: false,
    conflict: false,
    bullishScore: 0,
    bearishScore: 0,
    timeframeResults: [
      {
        timeframe: "4h",
        role: "MACRO",
        signal: "NEUTRAL",
        confidence: 0,
        trendDirection: "SIDEWAYS",
        trendStrength: 50,
        weight: 1,
      },
    ],
    explanation: { code: "MTF_NEUTRAL" },
    ...over,
  } as AtlasMtfResult;
}

function priceAction(
  over: Partial<PriceActionResult> = {}
): PriceActionResult {
  return {
    structure: "NEUTRAL",
    bullishBos: false,
    bearishBos: false,
    bullishChoch: false,
    bearishChoch: false,
    ...over,
  } as unknown as PriceActionResult;
}

function liquidity(
  over: Partial<LiquidityResult> = {}
): LiquidityResult {
  return {
    bullishSweep: false,
    bearishSweep: false,
    ...over,
  } as unknown as LiquidityResult;
}

describe("buildTradeChecklist", () => {
  it("marks all five met for a fully-aligned long", () => {
    const c = buildTradeChecklist({
      signal: "LONG",
      multiTimeframe: mtf({
        aligned: true,
        signal: "LONG",
        timeframeResults: [
          {
            timeframe: "4h",
            role: "MACRO",
            signal: "LONG",
            confidence: 80,
            trendDirection: "BULLISH",
            trendStrength: 80,
            weight: 1,
          },
        ],
      }),
      priceAction: priceAction({ structure: "BULLISH" }),
      liquidity: liquidity({ bullishSweep: true }),
      rawRsi: 62,
    });

    expect(c.direction).toBe("LONG");
    expect(c.metCount).toBe(5);
    expect(c.ready).toBe(true);
  });

  it("leaves trend unchecked when the regime opposes the long", () => {
    const c = buildTradeChecklist({
      signal: "LONG",
      multiTimeframe: mtf({
        aligned: true,
        signal: "LONG",
        timeframeResults: [
          {
            timeframe: "4h",
            role: "MACRO",
            signal: "LONG",
            confidence: 80,
            trendDirection: "STRONG_BEARISH",
            trendStrength: 95,
            weight: 1,
          },
        ],
      }),
      priceAction: priceAction({ structure: "BULLISH" }),
      liquidity: liquidity({ bullishSweep: true }),
      rawRsi: 62,
    });

    const trend = c.items.find((i) => i.key === "trend");
    expect(trend?.met).toBe(false);
    expect(c.ready).toBe(false);
    expect(c.metCount).toBe(4);
  });

  it("leans SHORT when WAIT and the bearish score is higher", () => {
    const c = buildTradeChecklist({
      signal: "WAIT",
      multiTimeframe: mtf({ bullishScore: 10, bearishScore: 40 }),
      priceAction: priceAction(),
      liquidity: liquidity(),
      rawRsi: 45,
    });

    expect(c.direction).toBe("SHORT");
    // momentum met (rsi<=50), nothing else lined up
    expect(c.items.find((i) => i.key === "momentum")?.met).toBe(true);
  });

  it("evaluates short-side structure and sweep", () => {
    const c = buildTradeChecklist({
      signal: "SHORT",
      multiTimeframe: mtf({
        aligned: true,
        signal: "SHORT",
        timeframeResults: [
          {
            timeframe: "4h",
            role: "MACRO",
            signal: "SHORT",
            confidence: 80,
            trendDirection: "BEARISH",
            trendStrength: 80,
            weight: 1,
          },
        ],
      }),
      priceAction: priceAction({ bearishChoch: true }),
      liquidity: liquidity({ bearishSweep: true }),
      rawRsi: 38,
    });

    expect(c.direction).toBe("SHORT");
    expect(c.metCount).toBe(5);
  });
});
