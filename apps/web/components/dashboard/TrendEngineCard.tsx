import type { TrendEngineResult } from "@/lib/atlas/trendEngine";

type Props = {
  trend: TrendEngineResult;
};

function getDirectionColor(direction: TrendEngineResult["direction"]) {
  switch (direction) {
    case "STRONG_BULLISH":
    case "BULLISH":
      return "text-emerald-400";

    case "STRONG_BEARISH":
    case "BEARISH":
      return "text-red-400";

    default:
      return "text-amber-300";
  }
}

export default function TrendEngineCard({
  trend,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Trend Engine
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            Market Trend
          </h3>
        </div>

        <div
          className={`text-lg font-semibold ${getDirectionColor(
            trend.direction
          )}`}
        >
          {trend.direction.replaceAll("_", " ")}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Strength
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {trend.strength}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Confidence
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {trend.confidence}%
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Atlas Explanation
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {trend.explanation}
        </p>
      </div>
    </div>
  );
}