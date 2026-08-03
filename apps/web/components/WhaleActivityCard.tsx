import { getLocale, getTranslations } from "next-intl/server";

import type { WhaleActivityResult } from "@/lib/atlas/whaleEngine";
import { WHALE_TRADE_THRESHOLD_USD } from "@/lib/atlas/whaleEngine";

type WhaleActivityCardProps = {
  activity: WhaleActivityResult;
};

export default async function WhaleActivityCard({
  activity,
}: WhaleActivityCardProps) {
  const t = await getTranslations("WhaleActivityCard");
  const locale = await getLocale();

  const toneClass =
    activity.netBias === "BULLISH"
      ? "text-green-400"
      : activity.netBias === "BEARISH"
        ? "text-red-400"
        : "text-zinc-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <p className="text-zinc-400">{t("title")}</p>

        <span className={`text-sm font-semibold ${toneClass}`}>
          {activity.netBias}
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-600">
        {t("windowExplanation", {
          threshold: WHALE_TRADE_THRESHOLD_USD.toLocaleString(locale),
          count: activity.windowTradeCount.toLocaleString(locale),
        })}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500">{t("largeBuys")}</p>
          <p className="mt-1 text-xl font-bold text-green-400">
            ${Math.round(activity.whaleBuyVolumeUsd).toLocaleString(locale)}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">{t("largeSells")}</p>
          <p className="mt-1 text-xl font-bold text-red-400">
            ${Math.round(activity.whaleSellVolumeUsd).toLocaleString(locale)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-zinc-400">
        {activity.explanation}
      </p>

      {activity.largestTrade && (
        <p className="mt-2 text-xs text-zinc-600">
          {t("largestTrade", {
            amount: Math.round(
              activity.largestTrade.quoteQuantity
            ).toLocaleString(locale),
            side: activity.largestTrade.side,
          })}
        </p>
      )}
    </div>
  );
}
