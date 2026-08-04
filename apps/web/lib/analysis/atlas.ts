import type { SignalType } from "../types/market";

type AtlasInput = {
  priceChangePercent: number;
  volume?: number;
};

type AtlasResult = {
  signal: SignalType;
  score: number;
};

export function calculateAtlasSignal({
  priceChangePercent,
  volume = 0,
}: AtlasInput): AtlasResult {
  const absoluteChange = Math.abs(priceChangePercent);

  let score = 50;

  if (priceChangePercent > 3 || priceChangePercent < -3) {
    score += 25;
  }

  if (volume > 1_000_000_000) {
    score += 10;
  }

  if (absoluteChange > 6) {
    score += 10;
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
  };
}