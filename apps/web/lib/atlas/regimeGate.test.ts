import { describe, expect, it } from "vitest";

import type {
  AtlasMtfResult,
  AtlasMtfTimeframeResult,
} from "@/lib/atlas/multiTimeframeEngine";
import {
  applyRegimeGate,
  readRegime,
  type RegimeGateConfig,
} from "@/lib/atlas/regimeGate";

const ON: RegimeGateConfig = { enabled: true, minRegimeStrength: 60 };

function tf(
  timeframe: AtlasMtfTimeframeResult["timeframe"],
  trendDirection: AtlasMtfTimeframeResult["trendDirection"],
  trendStrength: number
): AtlasMtfTimeframeResult {
  return {
    timeframe,
    role: "PRIMARY",
    signal: "NEUTRAL",
    confidence: 0,
    trendDirection,
    trendStrength,
    weight: 1,
  };
}

function mtf(
  results: AtlasMtfTimeframeResult[]
): AtlasMtfResult {
  return {
    signal: "NEUTRAL",
    confidence: 0,
    agreement: 0,
    aligned: false,
    conflict: false,
    bullishScore: 0,
    bearishScore: 0,
    timeframeResults: results,
    explanation: { code: "MTF_NEUTRAL" },
  };
}

describe("readRegime", () => {
  it("anchors on the highest available timeframe", () => {
    const regime = readRegime(
      mtf([
        tf("15m", "BEARISH", 70),
        tf("1h", "BEARISH", 70),
        tf("4h", "BULLISH", 80),
      ])
    );

    expect(regime.direction).toBe("BULLISH");
    expect(regime.strength).toBe(80);
  });

  it("collapses strong variants to plain direction", () => {
    expect(
      readRegime(mtf([tf("4h", "STRONG_BEARISH", 95)])).direction
    ).toBe("BEARISH");
  });
});

describe("applyRegimeGate", () => {
  it("passes a with-trend long", () => {
    const r = applyRegimeGate(
      "LONG",
      { direction: "BULLISH", strength: 80 },
      ON
    );
    expect(r.gated).toBe(false);
    expect(r.signal).toBe("LONG");
  });

  it("blocks a counter-trend long in a downtrend", () => {
    const r = applyRegimeGate(
      "LONG",
      { direction: "BEARISH", strength: 80 },
      ON
    );
    expect(r.gated).toBe(true);
    expect(r.signal).toBe("WAIT");
    expect(r.reason?.code).toBe("REGIME_GATE_COUNTER_TREND_LONG");
  });

  it("blocks a counter-trend short in an uptrend", () => {
    const r = applyRegimeGate(
      "SHORT",
      { direction: "BULLISH", strength: 80 },
      ON
    );
    expect(r.gated).toBe(true);
    expect(r.reason?.code).toBe("REGIME_GATE_COUNTER_TREND_SHORT");
  });

  it("waits in chop (neutral regime)", () => {
    const r = applyRegimeGate(
      "LONG",
      { direction: "NEUTRAL", strength: 90 },
      ON
    );
    expect(r.gated).toBe(true);
    expect(r.reason?.code).toBe("REGIME_GATE_CHOP");
  });

  it("waits when the trend is too weak to trust", () => {
    const r = applyRegimeGate(
      "SHORT",
      { direction: "BEARISH", strength: 40 },
      ON
    );
    expect(r.gated).toBe(true);
    expect(r.reason?.code).toBe("REGIME_GATE_CHOP");
  });

  it("never touches an existing WAIT", () => {
    const r = applyRegimeGate(
      "WAIT",
      { direction: "BEARISH", strength: 80 },
      ON
    );
    expect(r.gated).toBe(false);
    expect(r.signal).toBe("WAIT");
  });

  it("is a no-op when disabled", () => {
    const r = applyRegimeGate(
      "LONG",
      { direction: "BEARISH", strength: 80 },
      { enabled: false, minRegimeStrength: 60 }
    );
    expect(r.gated).toBe(false);
    expect(r.signal).toBe("LONG");
  });
});
