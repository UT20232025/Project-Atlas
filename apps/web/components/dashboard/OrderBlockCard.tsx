import type { OrderBlockResult } from "@/lib/atlas/orderBlockEngine";

type OrderBlockCardProps = {
  orderBlocks: OrderBlockResult;
};

function formatPrice(price: number | null): string {
  if (price === null) {
    return "Not available";
  }

  return price.toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
}

export default function OrderBlockCard({
  orderBlocks,
}: OrderBlockCardProps) {
  const bullish =
    orderBlocks.nearestBullishOrderBlock;

  const bearish =
    orderBlocks.nearestBearishOrderBlock;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Order Blocks
        </p>

        <p className="mt-2 text-sm text-zinc-400">
          Nearest active institutional demand and supply zones.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Bullish Order Block
          </p>

          {bullish ? (
            <>
              <p className="mt-2 text-xl font-semibold text-emerald-400">
                {formatPrice(bullish.low)} –{" "}
                {formatPrice(bullish.high)}
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                Midpoint:{" "}
                <span className="text-zinc-200">
                  {formatPrice(bullish.midpoint)}
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Strength:{" "}
                <span className="text-emerald-300">
                  {bullish.strength}/100
                </span>
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              No active bullish order block found.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Bearish Order Block
          </p>

          {bearish ? (
            <>
              <p className="mt-2 text-xl font-semibold text-red-400">
                {formatPrice(bearish.low)} –{" "}
                {formatPrice(bearish.high)}
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                Midpoint:{" "}
                <span className="text-zinc-200">
                  {formatPrice(bearish.midpoint)}
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Strength:{" "}
                <span className="text-red-300">
                  {bearish.strength}/100
                </span>
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              No active bearish order block found.
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        {orderBlocks.summary}
      </p>
    </div>
  );
}