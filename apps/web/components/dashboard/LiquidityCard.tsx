import type { LiquidityResult } from "@/lib/atlas/liquidityEngine";

type Props = {
  liquidity: LiquidityResult;
};

function formatPrice(value: number | null) {
  if (value === null) {
    return "Not detected";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
}

function getDirectionColor(
  direction: LiquidityResult["sweepDirection"]
) {
  switch (direction) {
    case "BULLISH":
      return "text-emerald-400";

    case "BEARISH":
      return "text-red-400";

    default:
      return "text-zinc-500";
  }
}

function Status({
  label,
  value,
}: {
  label: string;
  value: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-3">
      <span className="text-sm text-zinc-300">
        {label}
      </span>

      <span
        className={
          value
            ? "font-semibold text-emerald-400"
            : "font-semibold text-zinc-600"
        }
      >
        {value ? "✓" : "—"}
      </span>
    </div>
  );
}

export default function LiquidityCard({
  liquidity,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Liquidity
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            Liquidity Engine
          </h3>
        </div>

        <div
          className={`text-lg font-semibold ${getDirectionColor(
            liquidity.sweepDirection
          )}`}
        >
          {liquidity.sweepDirection}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Status
          label="Equal Highs"
          value={liquidity.equalHighs}
        />

        <Status
          label="Equal Lows"
          value={liquidity.equalLows}
        />

        <Status
          label="Bullish Sweep"
          value={liquidity.bullishSweep}
        />

        <Status
          label="Bearish Sweep"
          value={liquidity.bearishSweep}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Liquidity Above
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {formatPrice(liquidity.liquidityAbove)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Liquidity Below
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {formatPrice(liquidity.liquidityBelow)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Sweep Level
          </p>

          <p className="text-white font-semibold">
            {formatPrice(liquidity.sweepLevel)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Confidence
          </p>

          <p className="font-semibold text-white">
            {liquidity.confidence}%
          </p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-[#ffffff]"
            style={{
              width: `${liquidity.confidence}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Atlas Explanation
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {liquidity.explanation}
        </p>
      </div>
    </div>
  );
}