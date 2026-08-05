import { describe, expect, it } from "vitest";

import {
  makeAtlasDecision,
  type AtlasDecisionEngineInput,
} from "./aiDecisionEngine";
import type { OrderBlockZone } from "./orderBlockEngine";
import type { FairValueGap } from "./fairValueGapEngine";

function fakeOrderBlockZone(strength: number): OrderBlockZone {
  return {
    direction: "BEARISH",
    high: 100,
    low: 90,
    midpoint: 95,
    candleIndex: 0,
    mitigated: false,
    strength,
  };
}

function fakeFairValueGap(strength: number): FairValueGap {
  return {
    direction: "BEARISH",
    high: 100,
    low: 90,
    midpoint: 95,
    candleIndex: 0,
    filled: false,
    strength,
  };
}

type InputOverrides = {
  proposedSignal?: AtlasDecisionEngineInput["proposedSignal"];
  trend?: Partial<AtlasDecisionEngineInput["trend"]>;
  multiTimeframe?: Partial<
    AtlasDecisionEngineInput["multiTimeframe"]
  >;
  priceAction?: Partial<AtlasDecisionEngineInput["priceAction"]>;
  liquidity?: Partial<AtlasDecisionEngineInput["liquidity"]>;
  volume?: Partial<AtlasDecisionEngineInput["volume"]>;
  marketStructure?: Partial<
    AtlasDecisionEngineInput["marketStructure"]
  >;
  orderBlocks?: Partial<AtlasDecisionEngineInput["orderBlocks"]>;
  fairValueGaps?: Partial<
    AtlasDecisionEngineInput["fairValueGaps"]
  >;
  risk?: Partial<AtlasDecisionEngineInput["risk"]>;
};

function buildInput(
  overrides: InputOverrides = {}
): AtlasDecisionEngineInput {
  const base = {
    proposedSignal: "WAIT",

    trend: { direction: "SIDEWAYS", confidence: 50 },
    multiTimeframe: { signal: "WAIT", aligned: false },

    priceAction: {
      structure: "RANGING",
      bullishBos: false,
      bearishBos: false,
      bullishChoch: false,
      bearishChoch: false,
    },

    liquidity: { bullishSweep: false, bearishSweep: false },

    volume: {
      pressure: "NEUTRAL",
      confirmation: "NOT_CONFIRMED",
      spike: false,
    },

    marketStructure: { trend: "RANGING", event: "NONE" },

    orderBlocks: {
      nearestBullishOrderBlock: null,
      nearestBearishOrderBlock: null,
    },

    fairValueGaps: {
      nearestBullishFairValueGap: null,
      nearestBearishFairValueGap: null,
    },

    vwap: {
      vwap: null,
      price: 0,
      bias: "NEUTRAL",
      distancePercent: 0,
    },

    premiumDiscount: {
      zone: "EQUILIBRIUM",
      rangeHigh: null,
      rangeLow: null,
      equilibrium: null,
      positionPercent: 50,
    },

    session: {
      zone: "OFF_HOURS",
      inKillzone: false,
      hourUtc: 20,
    },

    fibonacci: {
      inGoldenPocket: false,
      direction: "NONE",
      swingHigh: null,
      swingLow: null,
      goldenPocketLow: null,
      goldenPocketHigh: null,
    },

    risk: {
      confidence: 50,
      validTrade: true,
      direction: "WAIT",
      reasons: [],
      warnings: [],
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskRewardRatio: null,
    },
  };

  return {
    ...base,
    ...overrides,
    trend: { ...base.trend, ...overrides.trend },
    multiTimeframe: {
      ...base.multiTimeframe,
      ...overrides.multiTimeframe,
    },
    priceAction: { ...base.priceAction, ...overrides.priceAction },
    liquidity: { ...base.liquidity, ...overrides.liquidity },
    volume: { ...base.volume, ...overrides.volume },
    marketStructure: {
      ...base.marketStructure,
      ...overrides.marketStructure,
    },
    orderBlocks: { ...base.orderBlocks, ...overrides.orderBlocks },
    fairValueGaps: {
      ...base.fairValueGaps,
      ...overrides.fairValueGaps,
    },
    risk: { ...base.risk, ...overrides.risk },
  } as unknown as AtlasDecisionEngineInput;
}

describe("makeAtlasDecision", () => {
  it("recommends WAIT when nothing lines up", () => {
    const result = makeAtlasDecision(buildInput());

    expect(result.signal).toBe("WAIT");
    expect(result.tradeApproved).toBe(false);
    expect(result.strength).toBe("NONE");
    expect(result.entry).toBeNull();
  });

  it("approves a LONG trade when trend, multi-timeframe, price action, volume and risk all align", () => {
    const result = makeAtlasDecision(
      buildInput({
        proposedSignal: "LONG",
        trend: { direction: "BULLISH", confidence: 85 },
        multiTimeframe: { signal: "LONG", aligned: true },
        priceAction: {
          structure: "BULLISH",
          bullishBos: true,
        },
        marketStructure: { trend: "BULLISH", event: "BOS_BULLISH" },
        volume: {
          pressure: "BULLISH",
          confirmation: "CONFIRMED",
          spike: true,
        },
        liquidity: { bullishSweep: true },
        risk: {
          confidence: 90,
          validTrade: true,
          direction: "LONG",
          entry: 100,
          stopLoss: 95,
          takeProfit: 110,
          riskRewardRatio: 2,
        },
      })
    );

    expect(result.signal).toBe("LONG");
    expect(result.tradeApproved).toBe(true);
    expect(result.strength).toBe("STRONG");
    expect(result.bullishScore).toBe(100);
    expect(result.bearishScore).toBe(0);
    expect(result.entry).toBe(100);
  });

  it("downgrades to WAIT when the combined confidence is below the required minimum", () => {
    const result = makeAtlasDecision(
      buildInput({
        proposedSignal: "LONG",
        trend: { direction: "BULLISH", confidence: 50 },
        multiTimeframe: { signal: "LONG", aligned: false },
        priceAction: {
          structure: "RANGING",
          bullishBos: true,
        },
        risk: {
          confidence: 50,
          validTrade: true,
          direction: "LONG",
        },
      })
    );

    expect(result.signal).toBe("WAIT");
    expect(result.tradeApproved).toBe(false);
    expect(
      result.warnings.some(
        (warning) =>
          warning.code === "CONFIDENCE_BELOW_MINIMUM" &&
          warning.params?.minimumConfidence === 65
      )
    ).toBe(true);
  });

  it("adds the order block and fair value gap contribution to the bearish score", () => {
    const withoutZones = makeAtlasDecision(
      buildInput({ marketStructure: { trend: "BEARISH" } })
    );

    const withZones = makeAtlasDecision(
      buildInput({
        marketStructure: { trend: "BEARISH" },
        orderBlocks: {
          nearestBearishOrderBlock: fakeOrderBlockZone(80),
        },
        fairValueGaps: {
          nearestBearishFairValueGap: fakeFairValueGap(100),
        },
      })
    );

    expect(
      withZones.bearishScore - withoutZones.bearishScore
    ).toBe(16);
  });
});
