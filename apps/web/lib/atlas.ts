export type SignalType = "LONG" | "SHORT" | "WAIT";

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
  const absChange = Math.abs(priceChangePercent);

  let score = 50;
  const reason: string[] = [];

  if (priceChangePercent > 3) {
    score += 25;
    reason.push("Sterk positiv 24t-bevegelse");
  } else if (priceChangePercent < -3) {
    score += 25;
    reason.push("Sterk negativ 24t-bevegelse");
  } else {
    reason.push("Ingen tydelig retning siste 24t");
  }

  if (volume > 1_000_000_000) {
    score += 10;
    reason.push("Høyt handelsvolum");
  }

  if (absChange > 6) {
    score += 10;
    reason.push("Kraftig momentum");
  }

  score = Math.min(95, Math.max(45, score));

  const signal =
    priceChangePercent > 3
      ? "LONG"
      : priceChangePercent < -3
      ? "SHORT"
      : "WAIT";

  return {
    signal,
    score,
    reason,
  };
}