import { describe, expect, it } from "vitest";

import { getPositionGuidance } from "@/lib/trading/positionGuidance";

describe("getPositionGuidance", () => {
  it("holds when Atlas still agrees with the direction", () => {
    expect(
      getPositionGuidance({
        direction: "LONG",
        atlasSignal: "LONG",
        pnlPercent: 5,
      })
    ).toEqual({ verdict: "HOLD", reasonKey: "aligned" });
  });

  it("flags exit when Atlas flips against the position", () => {
    expect(
      getPositionGuidance({
        direction: "LONG",
        atlasSignal: "SHORT",
        pnlPercent: 2,
      })
    ).toEqual({ verdict: "EXIT", reasonKey: "flipped" });

    expect(
      getPositionGuidance({
        direction: "SHORT",
        atlasSignal: "LONG",
        pnlPercent: -1,
      }).verdict
    ).toBe("EXIT");
  });

  it("suggests protecting profit when the thesis cools while winning", () => {
    expect(
      getPositionGuidance({
        direction: "SHORT",
        atlasSignal: "WAIT",
        pnlPercent: 3,
      })
    ).toEqual({ verdict: "CONSIDER", reasonKey: "protectProfit" });
  });

  it("says hold with the stop when neutral and not in profit", () => {
    expect(
      getPositionGuidance({
        direction: "LONG",
        atlasSignal: "WAIT",
        pnlPercent: -2,
      })
    ).toEqual({ verdict: "CONSIDER", reasonKey: "noConviction" });
  });

  it("holds quietly when there is no fresh read", () => {
    expect(
      getPositionGuidance({
        direction: "LONG",
        atlasSignal: undefined,
        pnlPercent: null,
      })
    ).toEqual({ verdict: "HOLD", reasonKey: "noRead" });
  });
});
