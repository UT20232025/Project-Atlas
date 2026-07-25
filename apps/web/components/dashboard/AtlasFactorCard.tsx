import type { AtlasFactorResult } from "@/lib/atlas/atlasEngine";

type Props = {
  factor: AtlasFactorResult;
};

function getStatusColor(status: AtlasFactorResult["status"]) {
  switch (status) {
    case "BULLISH":
      return "text-green-400 bg-green-500/10 border-green-500/20";
    case "BEARISH":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    default:
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  }
}

export default function AtlasFactorCard({ factor }: Props) {
  const percent = (factor.score / factor.maxScore) * 100;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-white">
            {factor.label}
          </h4>

          <p className="mt-1 text-sm text-zinc-500">
            {factor.explanation}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
            factor.status
          )}`}
        >
          {factor.status}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex justify-between text-xs text-zinc-500">
          <span>Strength</span>
          <span>
            {factor.score}/{factor.maxScore}
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}