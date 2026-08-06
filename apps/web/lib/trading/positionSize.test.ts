import { describe, expect, it } from "vitest";

import { calculatePositionSize } from "@/lib/trading/positionSize";

describe("calculatePositionSize", () => {
  it("sizes a position so the stop loses exactly the risk amount", () => {
    const result = calculatePositionSize({
      accountSize: 1000,
      riskPercent: 1,
      entry: 100,
      stopLoss: 95,
    });

    expect(result).not.toBeNull();
    expect(result?.dollarRisk).toBe(10);
    expect(result?.riskPerUnit).toBe(5);
    expect(result?.positionSize).toBe(2);
    expect(result?.positionValue).toBe(200);
  });

  it("scales with the risk percent", () => {
    const result = calculatePositionSize({
      accountSize: 5000,
      riskPercent: 2,
      entry: 200,
      stopLoss: 180,
    });

    // risk $100, riskPerUnit 20 → 5 units, notional 1000.
    expect(result?.dollarRisk).toBe(100);
    expect(result?.positionSize).toBe(5);
    expect(result?.positionValue).toBe(1000);
  });

  it("returns null when the stop equals the entry", () => {
    expect(
      calculatePositionSize({
        accountSize: 1000,
        riskPercent: 1,
        entry: 100,
        stopLoss: 100,
      })
    ).toBeNull();
  });

  it("returns null for non-positive account or risk", () => {
    expect(
      calculatePositionSize({
        accountSize: 0,
        riskPercent: 1,
        entry: 100,
        stopLoss: 95,
      })
    ).toBeNull();

    expect(
      calculatePositionSize({
        accountSize: 1000,
        riskPercent: 0,
        entry: 100,
        stopLoss: 95,
      })
    ).toBeNull();
  });
});
