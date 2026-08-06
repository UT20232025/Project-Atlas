import { describe, expect, it } from "vitest";

import { analyzeVolumeProfile } from "@/lib/atlas/volumeProfileEngine";

function heavy(price: number, volume: number) {
  return {
    high: price + 1,
    low: price - 1,
    close: price,
    volume,
  };
}

describe("analyzeVolumeProfile", () => {
  it("is BULLISH when price trades above the POC", () => {
    const candles = [
      ...Array.from({ length: 20 }, () => heavy(100, 1000)),
      heavy(130, 10),
    ];

    const result = analyzeVolumeProfile(candles);

    expect(result.poc).not.toBeNull();
    expect(result.poc as number).toBeLessThan(115);
    expect(result.bias).toBe("BULLISH");

    // Value area brackets the POC.
    expect(result.valueAreaLow).not.toBeNull();
    expect(result.valueAreaHigh).not.toBeNull();
    expect(
      result.valueAreaLow as number
    ).toBeLessThanOrEqual(result.poc as number);
    expect(
      result.valueAreaHigh as number
    ).toBeGreaterThanOrEqual(result.poc as number);
  });

  it("is BEARISH when price trades below the POC", () => {
    const candles = [
      ...Array.from({ length: 20 }, () => heavy(200, 1000)),
      heavy(170, 10),
    ];

    const result = analyzeVolumeProfile(candles);

    expect(result.poc as number).toBeGreaterThan(185);
    expect(result.bias).toBe("BEARISH");
  });

  it("returns a null POC when there is no volume", () => {
    const candles = Array.from({ length: 30 }, (_, i) => ({
      high: 100 + i + 1,
      low: 100 + i - 1,
      close: 100 + i,
      volume: 0,
    }));

    const result = analyzeVolumeProfile(candles);

    expect(result.poc).toBeNull();
    expect(result.bias).toBe("NEUTRAL");
  });

  it("is empty with no candles", () => {
    const result = analyzeVolumeProfile([]);

    expect(result.poc).toBeNull();
    expect(result.bias).toBe("NEUTRAL");
  });
});
