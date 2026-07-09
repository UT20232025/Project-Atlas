type AtlasAnalysisProps = {
  signal: "LONG" | "SHORT" | "WAIT";
  score: number;
  change: string;
};

export default function AtlasAnalysis({
  signal,
  score,
  change,
}: AtlasAnalysisProps) {
  const changeNumber = Number(change);

  const momentum =
    changeNumber > 3
      ? "Sterkt bullish momentum"
      : changeNumber < -3
      ? "Sterkt bearish momentum"
      : "Nøytralt momentum";

  const risk =
    score >= 80
      ? "Medium"
      : score >= 65
      ? "Medium / høy"
      : "Lav / vent";

  const conclusion =
    signal === "LONG"
      ? "Markedet viser styrke. Vent helst på god inngang og bruk tydelig stop loss."
      : signal === "SHORT"
      ? "Markedet viser svakhet. Ikke short blindt; vent på bekreftet brudd eller retest."
      : "Markedet er uklart. Atlas anbefaler å vente på bedre oppsett.";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="text-3xl font-bold">Atlas Analysis</h2>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-sm text-zinc-500">Momentum</p>
          <p className="mt-2 font-semibold">{momentum}</p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-sm text-zinc-500">Risk</p>
          <p className="mt-2 font-semibold">{risk}</p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-sm text-zinc-500">Signal</p>
          <p className="mt-2 font-semibold">{signal}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-zinc-950 p-5">
        <p className="text-sm text-zinc-500">Conclusion</p>
        <p className="mt-2 text-zinc-300">{conclusion}</p>
      </div>
    </div>
  );
}