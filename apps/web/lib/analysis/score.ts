export type AtlasScoreBreakdown = {
  trend: number;
  momentum: number;
  volume: number;
  market: number;
  risk: number;
  total: number;
};

type ScoreInput = {
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  rsi: number;
  volume24h: number;
  confidence: number;
};

export function calculateAtlasScore(
  input: ScoreInput
): AtlasScoreBreakdown {
  let trend = 0;

  switch (input.trend) {
    case "BULLISH":
      trend = 25;
      break;
    case "NEUTRAL":
      trend = 15;
      break;
    case "BEARISH":
      trend = 5;
      break;
  }

  let momentum = 10;

  if (input.rsi >= 45 && input.rsi <= 65) {
    momentum = 25;
  } else if (input.rsi >= 35 && input.rsi <= 75) {
    momentum = 18;
  }

  const volume =
    input.volume24h > 1_000_000_000 ? 20 : 12;

  const market = Math.min(
    20,
    Math.round(input.confidence / 5)
  );

  const risk =
    input.rsi > 75 || input.rsi < 25 ? 5 : 10;

  return {
    trend,
    momentum,
    volume,
    market,
    risk,
    total:
      trend +
      momentum +
      volume +
      market +
      risk,
  };
}