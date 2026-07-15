"use client";

import { useEffect, useState } from "react";

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
      dot: "bg-green-400",
      ring: "#22c55e",
      label: "Bullish",
    };
  }

  if (signal === "SHORT") {
    return {
      text: "text-red-400",
      dot: "bg-red-400",
      ring: "#ef4444",
      label: "Bearish",
    };
  }

  return {
    text: "text-yellow-400",
    dot: "bg-yellow-400",
    ring: "#eab308",
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
        <span className="font-semibold text-zinc-200">{safeValue}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-700"
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
  const safeScore = Math.round(Math.max(0, Math.min(100, score)));
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const duration = 900;
    const startedAt = performance.now();

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.round(safeScore * easedProgress));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [safeScore]);

  return (
    <section className="atlas-card rounded-3xl p-6 md:p-8">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:items-center">
        <div className="flex flex-col items-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
            Atlas Score
          </p>

          <div className="relative mt-6 h-56 w-56">
            <div
              className="absolute inset-0 rounded-full shadow-[0_0_50px_rgba(59,130,246,0.18)]"
              style={{
                background: `conic-gradient(${styles.ring} ${
                  safeScore * 3.6
                }deg, #27272a 0deg)`,
              }}
            />

            <div className="absolute inset-[14px] rounded-full bg-zinc-950" />

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-7xl font-bold tracking-tight">
                {displayScore}
              </p>

              <p className="mt-1 text-sm text-zinc-500">av 100</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span
              className={`h-3 w-3 animate-pulse rounded-full ${styles.dot}`}
            />

            <p className={`text-lg font-semibold ${styles.text}`}>
              {styles.label} · {signal}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ScoreBar label="Trend" value={trend} />
          <ScoreBar label="Momentum" value={momentum} />
          <ScoreBar label="Volume" value={volume} />
          <ScoreBar label="Risk" value={risk} />
        </div>
      </div>
    </section>
  );
}