import { describe, expect, it } from "vitest";

import { buildStopPlan } from "@/lib/atlas/tradeManagement";

const LONG = {
  direction: "LONG",
  entry: 100,
  stopLoss: 95,
  takeProfit1: 108,
  takeProfit2: 116,
  takeProfit3: 130,
};

describe("buildStopPlan", () => {
  it("walks the stop up through the targets", () => {
    const plan = buildStopPlan(LONG);
    expect(plan).not.toBeNull();
    expect(plan).toEqual([
      { key: "entry", trigger: null, stop: 95 },
      { key: "breakeven", trigger: 108, stop: 100 },
      { key: "lock", trigger: 116, stop: 108 },
      { key: "trail", trigger: 130, stop: 116 },
    ]);
  });

  it("returns null when the setup is WAIT", () => {
    expect(buildStopPlan({ ...LONG, direction: "WAIT" })).toBeNull();
  });

  it("returns null without an entry, stop, or first target", () => {
    expect(buildStopPlan({ ...LONG, takeProfit1: null })).toBeNull();
    expect(buildStopPlan({ ...LONG, stopLoss: null })).toBeNull();
  });

  it("drops later stages whose target is missing", () => {
    const plan = buildStopPlan({ ...LONG, takeProfit3: null });
    expect(plan?.map((stage) => stage.key)).toEqual([
      "entry",
      "breakeven",
      "lock",
    ]);
  });
});
