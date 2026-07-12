import { EMA, RSI } from "technicalindicators";

export function calculateRSI(closes: number[]) {
  const values = RSI.calculate({
    values: closes,
    period: 14,
  });

  return values.at(-1) ?? 50;
}

export function calculateEMA(closes: number[], period: number) {
  const values = EMA.calculate({
    values: closes,
    period,
  });

  return values.at(-1) ?? closes.at(-1) ?? 0;
}

export function getRSILabel(rsi: number) {
  if (rsi >= 70) {
    return {
      label: "Overbought",
      color: "text-red-400",
    };
  }

  if (rsi <= 30) {
    return {
      label: "Oversold",
      color: "text-green-400",
    };
  }

  return {
    label: "Neutral",
    color: "text-yellow-400",
  };
}