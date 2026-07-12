type EMACardProps = {
  ema20: number;
  ema50: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
};

export default function EMACard({
  ema20,
  ema50,
  trend,
}: EMACardProps) {
  const trendColor =
    trend === "BULLISH"
      ? "text-green-400"
      : trend === "BEARISH"
        ? "text-red-400"
        : "text-yellow-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-zinc-400">EMA Trend</p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">EMA 20</span>
          <span className="font-semibold">
            ${ema20.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-500">EMA 50</span>
          <span className="font-semibold">
            ${ema50.toFixed(2)}
          </span>
        </div>
      </div>

      <p className={`mt-5 text-xl font-bold ${trendColor}`}>
        {trend}
      </p>
    </div>
  );
}