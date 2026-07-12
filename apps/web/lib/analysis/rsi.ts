import { RSI } from "technicalindicators";

export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length <= period) {
    return 50;
  }

  const values = RSI.calculate({
    values: closes,
    period,
  });

  return values.at(-1) ?? 50;
}