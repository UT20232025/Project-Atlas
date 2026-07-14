type RSIChartProps = {
  values: number[];
};

export default function RSIChart({ values }: RSIChartProps) {
  const width = 1000;
  const height = 280;
  const padding = 30;

  const safeValues = values.length > 0 ? values : [50];

  const points = safeValues
    .map((value, index) => {
      const x =
        padding +
        (index / Math.max(1, safeValues.length - 1)) *
          (width - padding * 2);

      const y =
        padding +
        ((100 - value) / 100) *
          (height - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");

  const getY = (value: number) =>
    padding +
    ((100 - value) / 100) *
      (height - padding * 2);

  const latestRSI = safeValues.at(-1) ?? 50;

  const latestColor =
    latestRSI >= 70
      ? "text-red-400"
      : latestRSI <= 30
        ? "text-green-400"
        : "text-yellow-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RSI History</h2>
          <p className="text-sm text-zinc-500">
            RSI 14 · 1-hour candles
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-zinc-500">Current RSI</p>
          <p className={`text-3xl font-bold ${latestColor}`}>
            {latestRSI.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-zinc-950">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[280px] w-full"
          preserveAspectRatio="none"
        >
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
            stroke="#3b82f6"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="mt-4 flex justify-between text-sm text-zinc-500">
        <span>Oversold below 30</span>
        <span>Overbought above 70</span>
      </div>
    </div>
  );
}