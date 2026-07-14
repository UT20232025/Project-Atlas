type AtlasExplainProps = {
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  reasons: string[];
};

export default function AtlasExplain({
  signal,
  confidence,
  reasons,
}: AtlasExplainProps) {
  const signalColor =
    signal === "LONG"
      ? "text-green-400"
      : signal === "SHORT"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            🤖 Why Atlas chose {signal}
          </h2>

          <p className="mt-1 text-zinc-500">
            AI explanation of the current setup
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-zinc-500">
            Confidence
          </p>

          <p className={`text-4xl font-bold ${signalColor}`}>
            {confidence}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {reasons.map((reason, index) => (
          <div
            key={index}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex gap-3">
              <span className="text-green-400">✓</span>

              <p>{reason}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <p className="font-semibold text-blue-300">
          Atlas Summary
        </p>

        <p className="mt-2 text-zinc-300 leading-7">
          Atlas combines momentum, EMA trend,
          RSI strength and market confidence to
          determine whether the current setup
          statistically favors LONG, SHORT or WAIT.
        </p>
      </div>
    </section>
  );
}
