import { EMA } from "technicalindicators";
import type { TrendType } from "../types/market";

export function calculateEMA(closes: number[], period: number): number {
  if (closes.length < period) {
    return closes.at(-1) ?? 0;
  }

  const values = EMA.calculate({
    values: closes,
    period,
  });

  return values.at(-1) ?? closes.at(-1) ?? 0;
}

export function calculateEMATrend(
  ema20: number,
  ema50: number
): TrendType {
  if (ema20 > ema50) {
    return "BULLISH";
  }

  if (ema20 < ema50) {
    return "BEARISH";
  }

  return "NEUTRAL";
}