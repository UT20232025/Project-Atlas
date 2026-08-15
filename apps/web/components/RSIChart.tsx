import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

type RSIChartProps = {
  values: number[];
  timeframe: string;
  // Optional candle-timeframe selector rendered in the card.
  controls?: ReactNode;
};

export default async function RSIChart({
  values,
  timeframe,
  controls,
}: RSIChartProps) {
  const t = await getTranslations("RSIChart");
  const width = 1000;
  const height = 280;
  const padding = 30;

  const safeValues = values.length > 0 ? values : [50];

  const getX = (index: number) =>
    padding +
    (index / Math.max(1, safeValues.length - 1)) *
      (width - padding * 2);

  const getY = (value: number) =>
    padding + ((100 - value) / 100) * (height - padding * 2);

  const points = safeValues
    .map((value, index) => `${getX(index)},${getY(value)}`)
    .join(" ");

  const latestRSI = safeValues.at(-1) ?? 50;

  const latestColor =
    latestRSI >= 70
      ? "text-green-400"
      : latestRSI <= 30
        ? "text-red-400"
        : "text-yellow-400";

  // Vertical gradient mapped to RSI value: the line lights green while it's
  // in the overbought zone (>70) and red in the oversold zone (<30), blue in
  // between — TradingView style. Hard stops at the 70/30 levels.
  const off = (value: number) => getY(value) / height;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-sm text-zinc-500">
            {t("subtitle", { timeframe })}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-zinc-500">{t("currentRsi")}</p>
          <p className={`text-3xl font-bold ${latestColor}`}>
            {latestRSI.toFixed(1)}
          </p>
        </div>
      </div>

      {controls && (
        <div className="mb-4 flex justify-end">{controls}</div>
      )}

      <div className="overflow-hidden rounded-xl bg-zinc-950">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[280px] w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="rsiLineGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2={height}
            >
              <stop offset="0" stopColor="#22c55e" />
              <stop offset={off(70)} stopColor="#22c55e" />
              <stop offset={off(70)} stopColor="#3b82f6" />
              <stop offset={off(30)} stopColor="#3b82f6" />
              <stop offset={off(30)} stopColor="#ef4444" />
              <stop offset="1" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Overbought / oversold zone tints */}
          <rect
            x={padding}
            y={getY(100)}
            width={width - padding * 2}
            height={getY(70) - getY(100)}
            fill="#22c55e"
            opacity="0.06"
          />
          <rect
            x={padding}
            y={getY(30)}
            width={width - padding * 2}
            height={getY(0) - getY(30)}
            fill="#ef4444"
            opacity="0.06"
          />

          {[30, 50, 70].map((level) => (
            <g key={level}>
              <line
                x1={padding}
                y1={getY(level)}
                x2={width - padding}
                y2={getY(level)}
                stroke="#3f3f46"
                strokeWidth="1"
                strokeDasharray={level === 50 ? "4 6" : "8 8"}
                vectorEffect="non-scaling-stroke"
              />

              <text
                x="4"
                y={getY(level) + 5}
                fill="#71717a"
                fontSize="16"
              >
                {level}
              </text>
            </g>
          ))}

          <polyline
            points={points}
            fill="none"
            stroke="url(#rsiLineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="mt-4 flex justify-between text-sm text-zinc-500">
        <span>{t("oversoldBelow")}</span>
        <span>{t("overboughtAbove")}</span>
      </div>
    </div>
  );
}
