import { describe, expect, it } from "vitest";

import { analyzeSession } from "@/lib/atlas/sessionEngine";

function at(hourUtc: number): Date {
  return new Date(Date.UTC(2026, 0, 1, hourUtc, 0, 0));
}

describe("analyzeSession", () => {
  it("detects the London killzone (07–10 UTC)", () => {
    const result = analyzeSession(at(8));

    expect(result.zone).toBe("LONDON_KILLZONE");
    expect(result.inKillzone).toBe(true);
  });

  it("detects the New York killzone (12–15 UTC)", () => {
    const result = analyzeSession(at(13));

    expect(result.zone).toBe("NEW_YORK_KILLZONE");
    expect(result.inKillzone).toBe(true);
  });

  it("classifies early hours as Asia (not a killzone)", () => {
    const result = analyzeSession(at(3));

    expect(result.zone).toBe("ASIA");
    expect(result.inKillzone).toBe(false);
  });

  it("classifies quiet hours as off-hours", () => {
    const result = analyzeSession(at(20));

    expect(result.zone).toBe("OFF_HOURS");
    expect(result.inKillzone).toBe(false);
  });

  it("treats killzone boundaries as exclusive at the end", () => {
    expect(analyzeSession(at(10)).zone).not.toBe(
      "LONDON_KILLZONE"
    );
    expect(analyzeSession(at(15)).zone).not.toBe(
      "NEW_YORK_KILLZONE"
    );
  });
});
