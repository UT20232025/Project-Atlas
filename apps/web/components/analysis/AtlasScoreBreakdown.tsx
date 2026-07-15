import type { AtlasScoreBreakdown } from "../../lib/analysis/score";

type AtlasScoreBreakdownProps = {
  score: AtlasScoreBreakdown;
};

function ScoreRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
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
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function AtlasScoreBreakdownCard({
  score,
}: AtlasScoreBreakdownProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Atlas Score Breakdown</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Slik er den samlede poengsummen beregnet
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-zinc-500">Total</p>
          <p className="text-4xl font-bold text-blue-400">
            {score.total}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ScoreRow label="Trend" value={score.trend} max={25} />
        <ScoreRow label="Momentum" value={score.momentum} max={25} />
        <ScoreRow label="Volume" value={score.volume} max={20} />
        <ScoreRow label="Market Context" value={score.market} max={20} />
        <ScoreRow label="Risk" value={score.risk} max={10} />
      </div>
    </section>
  );
}
