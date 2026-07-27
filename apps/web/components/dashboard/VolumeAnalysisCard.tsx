import type { VolumeAnalysisResult } from "@/lib/atlas/volumeEngine";

type Props = {
  volume: VolumeAnalysisResult;
};

function getPressureColor(
  pressure: VolumeAnalysisResult["pressure"]
) {
  switch (pressure) {
    case "BULLISH":
      return "text-emerald-400";

    case "BEARISH":
      return "text-red-400";

    default:
      return "text-amber-300";
  }
}

export default function VolumeAnalysisCard({
  volume,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Volume Analysis
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            Market Volume
          </h3>
        </div>

        <div
          className={`text-lg font-semibold ${getPressureColor(
            volume.pressure
          )}`}
        >
          {volume.pressure}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Relative Volume
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {volume.relativeVolume.toFixed(2)}x
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Confidence
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {volume.confidence}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Trend
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {volume.volumeTrend}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Bullish Volume
          </p>

          <p className="mt-2 text-lg font-semibold text-emerald-400">
            {Math.round(volume.bullishVolume).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Bearish Volume
          </p>

          <p className="mt-2 text-lg font-semibold text-red-400">
            {Math.round(volume.bearishVolume).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Volume Spike
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {volume.spike ? "Yes" : "No"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Confirmation
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {volume.confirmation}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Atlas Explanation
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {volume.explanation}
        </p>
      </div>
    </div>
  );
}