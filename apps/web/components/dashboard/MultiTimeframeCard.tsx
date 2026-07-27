import type { AtlasMtfResult } from "@/lib/atlas/multiTimeframeEngine";

type Props = {
  mtf: AtlasMtfResult;
};

function getSignalColor(signal: string) {
  switch (signal) {
    case "STRONG_LONG":
    case "LONG":
      return "text-emerald-400";

    case "STRONG_SHORT":
    case "SHORT":
      return "text-red-400";

    default:
      return "text-amber-300";
  }
}

function getTrendColor(direction: string) {
  if (direction.includes("BULL")) {
    return "text-emerald-400";
  }

  if (direction.includes("BEAR")) {
    return "text-red-400";
  }

  return "text-zinc-400";
}

export default function MultiTimeframeCard({
  mtf,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Multi Timeframe
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            Timeframe Alignment
          </h3>
        </div>

        <div
          className={`text-lg font-semibold ${getSignalColor(
            mtf.signal
          )}`}
        >
          {mtf.signal}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Confidence
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {mtf.confidence}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Agreement
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {mtf.agreement}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Bullish
          </p>

          <p className="mt-2 text-xl font-semibold text-emerald-400">
            {mtf.bullishScore}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Bearish
          </p>

          <p className="mt-2 text-xl font-semibold text-red-400">
            {mtf.bearishScore}%
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-zinc-500">
            <tr className="border-b border-zinc-800">
              <th className="py-2 text-left">TF</th>
              <th className="py-2 text-left">Role</th>
              <th className="py-2 text-left">Signal</th>
              <th className="py-2 text-left">Trend</th>
              <th className="py-2 text-left">Confidence</th>
              <th className="py-2 text-left">Weight</th>
            </tr>
          </thead>

          <tbody>
            {mtf.timeframeResults.map((tf) => (
              <tr
                key={tf.timeframe}
                className="border-b border-zinc-900"
              >
                <td className="py-3 font-semibold text-white">
                  {tf.timeframe}
                </td>

                <td className="py-3 text-zinc-400">
                  {tf.role}
                </td>

                <td
                  className={`py-3 font-semibold ${getSignalColor(
                    tf.signal
                  )}`}
                >
                  {tf.signal}
                </td>

                <td
                  className={`py-3 ${getTrendColor(
                    tf.trendDirection
                  )}`}
                >
                  {tf.trendDirection}
                </td>

                <td className="py-3 text-white">
                  {tf.confidence}%
                </td>

                <td className="py-3 text-white">
                  {tf.weight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div
          className={`rounded-xl border p-4 ${
            mtf.aligned
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-zinc-800 bg-zinc-950/40"
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Alignment
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {mtf.aligned ? "Aligned" : "Not aligned"}
          </p>
        </div>

        <div
          className={`rounded-xl border p-4 ${
            mtf.conflict
              ? "border-red-500/20 bg-red-500/5"
              : "border-zinc-800 bg-zinc-950/40"
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Conflict
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {mtf.conflict ? "Yes" : "No"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Atlas Explanation
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {mtf.explanation}
        </p>
      </div>
    </div>
  );
}