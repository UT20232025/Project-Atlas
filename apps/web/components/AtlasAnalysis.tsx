type AtlasAnalysisProps = {
  signal: "LONG" | "SHORT" | "WAIT";
  score: number;
  change: string;
  reasons: string[];
};

export default function AtlasAnalysis({
  signal,
  score,
  change,
  reasons,
}: AtlasAnalysisProps) {
  const changeNumber = Number(change);

  const momentum =
    changeNumber > 3
      ? "Strong bullish momentum"
      : changeNumber < -3
      ? "Strong bearish momentum"
      : "Neutral momentum";

  const risk =
    score >= 85
      ? "Medium"
      : score >= 70
      ? "Medium / high"
      : "Wait / low quality";

  const conclusion =
    signal === "LONG"
      ? "The market is showing strength. Wait for a good entry and use a clear stop loss."
      : signal === "SHORT"
      ? "The market is showing weakness. Wait for a confirmed breakdown or retest before entry."
      : "The market is unclear. Atlas recommends waiting for a better setup.";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Atlas Analysis</h2>
          <p className="mt-1 text-zinc-500">
            Explanation based on Atlas Score {score}
          </p>
        </div>

        <div className="rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2">
          <span className="text-sm text-zinc-400">Signal: </span>
          <span className="font-semibold text-white">{signal}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">Momentum</p>
          <p className="mt-2 font-semibold">{momentum}</p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">Risk</p>
          <p className="mt-2 font-semibold">{risk}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-zinc-950 p-5">
        <p className="text-sm text-zinc-500">Why Atlas thinks this</p>

        <ul className="mt-4 space-y-3">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-3 text-zinc-300">
              <span className="mt-0.5 text-blue-400">●</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-sm text-zinc-500">Conclusion</p>
        <p className="mt-2 text-zinc-300">{conclusion}</p>
      </div>
    </div>
  );
}
