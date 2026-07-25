import Badge from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import Section from "@/components/ui/Section";

type IntelligenceItem = {
  coin: string;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  signal: "LONG" | "SHORT" | "WAIT";
  score: number;
  change24h: number;
};

type AtlasIntelligenceProps = {
  items: IntelligenceItem[];
  bullish: number;
  bearish: number;
  neutral: number;
};

function getMarketBias(
  bullish: number,
  bearish: number
): "BULLISH" | "BEARISH" | "NEUTRAL" {
  if (bullish > bearish) return "BULLISH";
  if (bearish > bullish) return "BEARISH";
  return "NEUTRAL";
}

function getBiasVariant(
  bias: "BULLISH" | "BEARISH" | "NEUTRAL"
): "green" | "red" | "yellow" {
  if (bias === "BULLISH") return "green";
  if (bias === "BEARISH") return "red";
  return "yellow";
}

function getConfidence(
  bullish: number,
  bearish: number,
  neutral: number
) {
  const total = bullish + bearish + neutral;

  if (total === 0) return 0;

  const strongestGroup = Math.max(
    bullish,
    bearish,
    neutral
  );

  return Math.round((strongestGroup / total) * 100);
}

function getProgressColor(
  bias: "BULLISH" | "BEARISH" | "NEUTRAL"
): "green" | "red" | "yellow" {
  if (bias === "BULLISH") return "green";
  if (bias === "BEARISH") return "red";
  return "yellow";
}

export default function AtlasIntelligence({
  items,
  bullish,
  bearish,
  neutral,
}: AtlasIntelligenceProps) {
  const marketBias = getMarketBias(bullish, bearish);
  const confidence = getConfidence(
    bullish,
    bearish,
    neutral
  );

  const strongestCoin = [...items].sort(
    (first, second) => second.score - first.score
  )[0];

  const weakestCoin = [...items].sort(
    (first, second) => first.score - second.score
  )[0];

  const biggestMover = [...items].sort(
    (first, second) =>
      Math.abs(second.change24h) -
      Math.abs(first.change24h)
  )[0];

  const recommendation =
    marketBias === "BULLISH"
      ? "Focus on high-quality LONG setups while momentum remains constructive."
      : marketBias === "BEARISH"
      ? "Prioritize capital protection and only consider SHORT setups with clear confirmation."
      : "The market is mixed. Wait for stronger confirmation before taking new positions.";

  return (
    <Section
      title="Atlas Intelligence"
      subtitle="AI-powered market overview"
    >
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5">
          <p className="text-sm text-zinc-500">
            Market Bias
          </p>

          <div className="mt-3">
            <Badge variant={getBiasVariant(marketBias)}>
              {marketBias}
            </Badge>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                Confidence
              </span>

              <span className="font-bold text-white">
                {confidence}%
              </span>
            </div>

            <Progress
              value={confidence}
              color={getProgressColor(marketBias)}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-green-400">
                {bullish}
              </p>
              <p className="text-xs text-zinc-500">
                Bullish
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-red-400">
                {bearish}
              </p>
              <p className="text-xs text-zinc-500">
                Bearish
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-yellow-400">
                {neutral}
              </p>
              <p className="text-xs text-zinc-500">
                Neutral
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <p className="text-sm text-zinc-500">
              Strongest Coin
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {strongestCoin?.coin ?? "N/A"}
            </p>

            <p className="mt-1 text-sm text-green-400">
              Atlas Score {strongestCoin?.score ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <p className="text-sm text-zinc-500">
              Weakest Coin
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {weakestCoin?.coin ?? "N/A"}
            </p>

            <p className="mt-1 text-sm text-red-400">
              Atlas Score {weakestCoin?.score ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <p className="text-sm text-zinc-500">
              Biggest Market Move
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {biggestMover?.coin ?? "N/A"}
            </p>

            <p
              className={
                (biggestMover?.change24h ?? 0) >= 0
                  ? "mt-1 text-sm text-green-400"
                  : "mt-1 text-sm text-red-400"
              }
            >
              {(biggestMover?.change24h ?? 0) >= 0
                ? "+"
                : ""}
              {(biggestMover?.change24h ?? 0).toFixed(2)}%
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <p className="text-sm text-zinc-500">
              Atlas Recommendation
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {recommendation}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}