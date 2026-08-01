import type { SignalType } from "../types/market";

type AtlasInput = {
  priceChangePercent: number;
  volume?: number;
};

type AtlasResult = {
  signal: SignalType;
  score: number;
  reason: string[];
};

export function calculateAtlasSignal({
  priceChangePercent,
  volume = 0,
}: AtlasInput): AtlasResult {
  const absoluteChange = Math.abs(priceChangePercent);

  let score = 50;
  const reason: string[] = [];

  if (priceChangePercent > 3) {
    score += 25;
    reason.push("Strong positive 24h move");
  } else if (priceChangePercent < -3) {
    score += 25;
    reason.push("Strong negative 24h move");
  } else {
    reason.push("No clear direction in the last 24h");
  }

  if (volume > 1_000_000_000) {
    score += 10;
    reason.push("High trading volume");
  }

  if (absoluteChange > 6) {
    score += 10;
    reason.push("Strong momentum");
  }

  const signal: SignalType =
    priceChangePercent > 3
      ? "LONG"
      : priceChangePercent < -3
        ? "SHORT"
        : "WAIT";

  return {
    signal,
    score: Math.min(95, Math.max(45, score)),
    reason,
  };
}