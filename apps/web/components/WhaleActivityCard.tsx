import type { WhaleActivityResult } from "@/lib/atlas/whaleEngine";
import { WHALE_TRADE_THRESHOLD_USD } from "@/lib/atlas/whaleEngine";

type WhaleActivityCardProps = {
  activity: WhaleActivityResult;
};

export default function WhaleActivityCard({
  activity,
}: WhaleActivityCardProps) {
  const toneClass =
    activity.netBias === "BULLISH"
      ? "text-green-400"
      : activity.netBias === "BEARISH"
        ? "text-red-400"
        : "text-zinc-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <p className="text-zinc-400">Whale Activity</p>

        <span className={`text-sm font-semibold ${toneClass}`}>
          {activity.netBias}
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-600">
        Large trades over ${WHALE_TRADE_THRESHOLD_USD.toLocaleString("en-US")}{" "}
        in the last {activity.windowTradeCount.toLocaleString("en-US")} trades
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500">Large buys</p>
          <p className="mt-1 text-xl font-bold text-green-400">
            ${Math.round(activity.whaleBuyVolumeUsd).toLocaleString("en-US")}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Large sells</p>
          <p className="mt-1 text-xl font-bold text-red-400">
            ${Math.round(activity.whaleSellVolumeUsd).toLocaleString("en-US")}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-zinc-400">
        {activity.explanation}
      </p>

      {activity.largestTrade && (
        <p className="mt-2 text-xs text-zinc-600">
          Largest single trade: $
          {Math.round(
            activity.largestTrade.quoteQuantity
          ).toLocaleString("en-US")}{" "}
          ({activity.largestTrade.side})
        </p>
      )}
    </div>
  );
}
