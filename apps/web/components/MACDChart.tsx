type MACDPoint = {
  macd: number;
  signal: number;
  histogram: number;
};

type MACDChartProps = {
  values: MACDPoint[];
};

export default function MACDChart({ values }: MACDChartProps) {
  const width = 1000;
  const height = 320;
  const padding = 35;

  const safeValues =
    values.length > 0
      ? values
      : [{ macd: 0, signal: 0, histogram: 0 }];

  const allNumbers = safeValues.flatMap((item) => [
    item.macd,
    item.signal,
    item.histogram,
  ]);

  const maxValue = Math.max(...allNumbers.map(Math.abs), 1);

  const getX = (index: number) =>
    padding +
    (index / Math.max(1, safeValues.length - 1)) *
      (width - padding * 2);

  const getY = (value: number) =>
    height / 2 -
    (value / maxValue) * (height / 2 - padding);

  const macdPoints = safeValues
    .map((item, index) => `${getX(index)},${getY(item.macd)}`)
    .join(" ");

  const signalPoints = safeValues
    .map((item, index) => `${getX(index)},${getY(item.signal)}`)
    .join(" ");

  const barWidth = Math.max(
    2,
    (width - padding * 2) / safeValues.length - 2
  );

  const latest = safeValues.at(-1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MACD</h2>
          <p className="text-sm text-zinc-500">
            12 / 26 / 9 · 1-hour candles
          </p>
        </div>

        <div className="text-right text-sm">
          <p className="text-zinc-500">Current histogram</p>
          <p
            className={
              (latest?.histogram ?? 0) >= 0
                ? "text-green-400"
                : "text-red-400"
            }
          >
            {(latest?.histogram ?? 0).toFixed(4)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-zinc-950">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[320px] w-full"
          preserveAspectRatio="none"
        >
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#3f3f46"
            strokeWidth="1"
          />

          {safeValues.map((item, index) => {
            const x = getX(index) - barWidth / 2;
            const y = getY(item.histogram);
            const zeroY = height / 2;
            const barHeight = Math.max(1, Math.abs(zeroY - y));

            return (
              <rect
                key={`${index}-${item.histogram}`}
                x={x}
                y={item.histogram >= 0 ? y : zeroY}
                width={barWidth}
                height={barHeight}
                fill={item.histogram >= 0 ? "#22c55e" : "#ef4444"}
                opacity="0.55"
              />
            );
          })}

          <polyline
            points={macdPoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <polyline
            points={signalPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="mt-4 flex gap-6 text-sm text-zinc-400">
        <span>Blå: MACD</span>
        <span>Oransje: Signal</span>
        <span>Histogram: Momentum</span>
      </div>
    </div>
  );
}