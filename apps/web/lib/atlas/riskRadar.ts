import type { ScannerItem } from "@/lib/analysis/scanner";

// A "crash risk radar" — NOT a timing prediction (nobody can do that reliably),
// but a read of how dangerous the regime is right now, from signals we already
// compute. It answers "how loaded is the powder", so a trader tightens stops /
// cuts size, and it spikes the moment a market-wide breakdown actually starts.

export type RiskLevel = "LOW" | "ELEVATED" | "HIGH";

export type RiskRadar = {
  score: number; // 0-100
  level: RiskLevel;
  // Reason codes for the biggest contributors, most severe first (i18n'd in UI).
  reasons: string[];
  // Sub-scores (0-100) for the breakdown display.
  greed: number;
  compression: number;
  breakdown: number;
  btcWeakness: number;
};

export function computeRiskRadar(params: {
  scanner: ScannerItem[];
  fearGreedValue: number;
}): RiskRadar {
  const { scanner, fearGreedValue } = params;
  const total = Math.max(1, scanner.length);

  // Euphoria precedes crashes — only the greed side loads crash risk.
  const greed =
    fearGreedValue > 50 ? Math.min(100, Math.round((fearGreedValue - 50) * 2)) : 0;

  // Volatility compression across the market — the coil before a violent move.
  const coilingCount = scanner.filter((item) => item.breakout.coiling).length;
  const compression = Math.round((coilingCount / total) * 100);

  // Market-wide breakdown IN PROGRESS — coins firing SHORT breakouts together.
  const breakdownCount = scanner.filter(
    (item) => item.breakout.detected && item.breakout.direction === "SHORT"
  ).length;
  const breakdown = Math.round((breakdownCount / total) * 100);

  // BTC leads the market — its weakness is everyone's risk.
  const btc = scanner.find((item) => item.coin === "BTCUSDT");
  const btcWeakness = btc
    ? btc.trend === "BEARISH"
      ? 100
      : btc.trend === "NEUTRAL"
        ? 40
        : 0
    : 40;

  const score = Math.round(
    0.35 * breakdown + 0.25 * greed + 0.2 * compression + 0.2 * btcWeakness
  );

  const level: RiskLevel =
    score >= 66 ? "HIGH" : score >= 34 ? "ELEVATED" : "LOW";

  // Rank the contributing reasons by severity for the "why".
  const scored: Array<{ code: string; value: number }> = [
    { code: "BREAKDOWN", value: breakdown },
    { code: "GREED", value: greed },
    { code: "COMPRESSION", value: compression },
    { code: "BTC_BEARISH", value: btcWeakness >= 100 ? 100 : 0 },
  ];
  const reasons = scored
    .filter((entry) => entry.value >= 50)
    .sort((a, b) => b.value - a.value)
    .map((entry) => entry.code);

  return { score, level, reasons, greed, compression, breakdown, btcWeakness };
}
