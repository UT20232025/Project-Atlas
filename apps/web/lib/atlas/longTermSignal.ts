import type { AtlasCandle } from "@/lib/atlas/atlasTypes";

// A long-horizon (position-trading) read, deliberately slow and robust — the
// opposite end from the intraday scanner and the momentum breakouts. Built on
// the classic long-term trend tools: price vs the 200-day SMA, the 50/200
// relationship (golden/death cross), and the slope of the 200-day. Answers
// "accumulate, hold, or reduce for the long run", not "enter here with a stop".

export type LongTermStance = "ACCUMULATE" | "HOLD" | "REDUCE" | "INSUFFICIENT";

export type LongTermSignal = {
  stance: LongTermStance;
  sma50: number | null;
  sma200: number | null;
  pctVs200: number | null; // price distance from the 200-day, %
  rising: boolean; // is the 200-day sloping up?
  goldenCross: boolean; // 50-day above 200-day
  overextended: boolean; // far above the 200-day → stretched
  reasons: string[];
  // The highest high in the window (≈ prior cycle high / ATH proxy) and the
  // upside to it — for a "buy now, hold to the top" position trade.
  cycleHigh: number | null;
  upsideToHigh: number | null; // % from current price to the cycle high
  atHigh: boolean; // price is at/above the prior high (blue sky)
};

function sma(values: number[], period: number, endOffset = 0): number | null {
  const end = values.length - endOffset;
  const start = end - period;
  if (start < 0) return null;
  const slice = values.slice(start, end);
  return slice.reduce((sum, v) => sum + v, 0) / slice.length;
}

export function computeLongTermSignal(
  candles: AtlasCandle[]
): LongTermSignal {
  const empty: LongTermSignal = {
    stance: "INSUFFICIENT",
    sma50: null,
    sma200: null,
    pctVs200: null,
    rising: false,
    goldenCross: false,
    overextended: false,
    reasons: [],
    cycleHigh: null,
    upsideToHigh: null,
    atHigh: false,
  };

  const closes = candles.map((c) => c.close);
  if (closes.length < 200) return empty;

  const price = closes[closes.length - 1];
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const sma200Prev = sma(closes, 200, 30); // 30 days ago, for slope
  if (sma50 == null || sma200 == null) return empty;

  const pctVs200 = ((price - sma200) / sma200) * 100;
  const rising = sma200Prev != null ? sma200 > sma200Prev : false;
  const goldenCross = sma50 > sma200;
  const overextended = pctVs200 > 50;
  const aboveTrend = price > sma200;

  // Target for a "hold to the top" trade: the highest high in the window.
  const cycleHigh = Math.max(...candles.map((c) => c.high));
  const atHigh = price >= cycleHigh * 0.995;
  const upsideToHigh = atHigh ? 0 : ((cycleHigh - price) / price) * 100;

  const reasons: string[] = [];
  let stance: LongTermStance;

  if (aboveTrend && goldenCross && rising) {
    stance = overextended ? "HOLD" : "ACCUMULATE";
    reasons.push("ABOVE_200", "GOLDEN_CROSS");
    if (rising) reasons.push("TREND_RISING");
    if (overextended) reasons.push("OVEREXTENDED");
  } else if (!aboveTrend && !goldenCross) {
    stance = "REDUCE";
    reasons.push("BELOW_200", "DEATH_CROSS");
  } else {
    stance = "HOLD";
    if (aboveTrend) reasons.push("ABOVE_200");
    else reasons.push("BELOW_200");
    if (goldenCross) reasons.push("GOLDEN_CROSS");
  }

  return {
    stance,
    sma50,
    sma200,
    pctVs200,
    rising,
    goldenCross,
    overextended,
    reasons,
    cycleHigh,
    upsideToHigh,
    atHigh,
  };
}
