import type { AtlasAnalysis } from "../../lib/atlas/atlasEngine";

type AtlasScoreBreakdownProps = {
  analysis: AtlasAnalysis;
  bullishScore: number;
  bearishScore: number;
};

function ScoreRow({
  label,
  value,
  max,
  color = "bg-blue-500",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className="text-sm font-semibold text-white">
          {value}/{max}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function AtlasScoreBreakdownCard({
  analysis,
  bullishScore,
  bearishScore,
}: AtlasScoreBreakdownProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Atlas Score Breakdown</h2>
          <p className="mt-1 text-sm text-zinc-500">
            How the combined score is calculated
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-zinc-500">Total</p>
          <p className="text-4xl font-bold text-blue-400">
            {analysis.score}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {analysis.factors.map((factor) => (
          <ScoreRow
            key={factor.name}
            label={factor.label}
            value={factor.score}
            max={factor.maxScore}
          />
        ))}
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        <p className="mb-4 text-sm text-zinc-500">
          AI Decision Engine — includes market structure,
          liquidity, order blocks, and fair value gaps
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <ScoreRow
            label="Bullish score"
            value={bullishScore}
            max={100}
            color="bg-green-500"
          />
          <ScoreRow
            label="Bearish score"
            value={bearishScore}
            max={100}
            color="bg-red-500"
          />
        </div>
      </div>
    </section>
  );
}
