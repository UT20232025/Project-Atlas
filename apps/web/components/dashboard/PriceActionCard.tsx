import type { PriceActionResult } from "@/lib/atlas/priceActionEngine";

type Props = {
  priceAction: PriceActionResult;
};

function formatPrice(value: number | null): string {
  if (value === null) {
    return "Not detected";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
}

function getStructureStyles(
  structure: PriceActionResult["structure"]
): string {
  if (structure === "BULLISH") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (structure === "BEARISH") {
    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-300";
}

function getDirectionStyles(
  direction:
    | PriceActionResult["bosDirection"]
    | PriceActionResult["chochDirection"]
): string {
  if (direction === "BULLISH") {
    return "text-emerald-400";
  }

  if (direction === "BEARISH") {
    return "text-red-400";
  }

  return "text-zinc-500";
}

function StructureItem({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-3">
      <span className="text-sm text-zinc-300">
        {label}
      </span>

      <span
        className={
          active
            ? "text-sm font-semibold text-emerald-400"
            : "text-sm font-semibold text-zinc-600"
        }
      >
        {active ? "✓" : "—"}
      </span>
    </div>
  );
}

export default function PriceActionCard({
  priceAction,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Price Action
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            Market Structure
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Swing structure, break of structure and
            change of character detected from recent
            candles.
          </p>
        </div>

        <div
          className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${getStructureStyles(
            priceAction.structure
          )}`}
        >
          {priceAction.structure}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StructureItem
          label="Higher High"
          active={priceAction.higherHigh}
        />

        <StructureItem
          label="Higher Low"
          active={priceAction.higherLow}
        />

        <StructureItem
          label="Lower High"
          active={priceAction.lowerHigh}
        />

        <StructureItem
          label="Lower Low"
          active={priceAction.lowerLow}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Break of Structure
          </p>

          <div className="mt-3 flex items-end justify-between gap-4">
            <p
              className={`text-xl font-semibold ${getDirectionStyles(
                priceAction.bosDirection
              )}`}
            >
              {priceAction.bosDirection}
            </p>

            <p className="text-sm text-zinc-400">
              {formatPrice(priceAction.bosLevel)}
            </p>
          </div>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Confirms continuation when price closes
            beyond a relevant swing level.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Change of Character
          </p>

          <div className="mt-3 flex items-end justify-between gap-4">
            <p
              className={`text-xl font-semibold ${getDirectionStyles(
                priceAction.chochDirection
              )}`}
            >
              {priceAction.chochDirection}
            </p>

            <p className="text-sm text-zinc-400">
              {formatPrice(priceAction.chochLevel)}
            </p>
          </div>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Warns that the current market structure
            may be shifting direction.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Latest Swing High
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {formatPrice(
              priceAction.lastHigh?.price ?? null
            )}
          </p>

          <p className="mt-3 text-xs text-zinc-600">
            Previous:{" "}
            {formatPrice(
              priceAction.previousHigh?.price ?? null
            )}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Latest Swing Low
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {formatPrice(
              priceAction.lastLow?.price ?? null
            )}
          </p>

          <p className="mt-3 text-xs text-zinc-600">
            Previous:{" "}
            {formatPrice(
              priceAction.previousLow?.price ?? null
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Confidence
          </p>

          <p className="text-sm font-semibold text-white">
            {priceAction.confidence}%
          </p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{
              width: `${priceAction.confidence}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Structure explanation
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {priceAction.explanation}
        </p>
      </div>
    </div>
  );
}