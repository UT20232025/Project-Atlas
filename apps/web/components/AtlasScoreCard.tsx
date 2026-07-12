type AtlasScoreCardProps = {
  score: number;
  signal: "LONG" | "SHORT" | "WAIT";
  trend?: number;
  momentum?: number;
  volume?: number;
  risk?: number;
};

function getSignalStyles(signal: AtlasScoreCardProps["signal"]) {
  if (signal === "LONG") {
    return {
      text: "text-green-400",
      bg: "bg-green-500",
      label: "Bullish",
    };
  }

  if (signal === "SHORT") {
    return {
      text: "text-red-400",
      bg: "bg-red-500",
      label: "Bearish",
    };
  }

  return {
    text: "text-yellow-400",
    bg: "bg-yellow-500",
    label: "Neutral",
  };
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-200">{safeValue}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export default function AtlasScoreCard({
  score,
  signal,
  trend = 50,
  momentum = 50,
  volume = 50,
  risk = 50,
}: AtlasScoreCardProps) {
  const styles = getSignalStyles(signal);
  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col items-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Atlas Score
          </p>

          <div className="relative mt-5 flex h-40 w-40 items-center justify-center rounded-full bg-zinc-950">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(rgb(59 130 246) ${
                  safeScore * 3.6
                }deg, rgb(39 39 42) 0deg)`,
              }}
            />

            <div className="absolute inset-3 rounded-full bg-zinc-950" />

            <div className="relative text-center">
              <p className="text-5xl font-bold">{safeScore}</p>
              <p className="text-sm text-zinc-500">av 100</p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${styles.bg}`} />
            <p className={`font-semibold ${styles.text}`}>
              {styles.label} · {signal}
            </p>
          </div>
        </div>

        <div className="grid flex-1 gap-5">
          <ScoreBar label="Trend" value={trend} />
          <ScoreBar label="Momentum" value={momentum} />
          <ScoreBar label="Volume" value={volume} />
          <ScoreBar label="Risk" value={risk} />
        </div>
      </div>
    </div>
  );
}