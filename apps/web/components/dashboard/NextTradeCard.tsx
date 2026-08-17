import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import type { ScannerItem } from "@/lib/analysis/scanner";

const CONDITION_TITLE_KEY: Record<string, string> = {
  trend: "trendTitle",
  timeframes: "timeframesTitle",
  structure: "structureTitle",
  liquidity: "liquidityTitle",
  momentum: "momentumTitle",
};

export default async function NextTradeCard({
  items,
}: {
  items: ScannerItem[];
}) {
  const t = await getTranslations("NextTrade");
  const tc = await getTranslations("TradeChecklist");

  // Closest to a trade: setups not yet ready, ranked by how many conditions
  // are already met (then confidence as a tiebreak).
  const candidates = items
    .filter((item) => !item.checklist.ready && item.checklist.total > 0)
    .sort(
      (a, b) =>
        b.checklist.metCount - a.checklist.metCount ||
        b.confidence - a.confidence
    )
    .slice(0, 3);

  return (
    <div className="atlas-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white">{t("title")}</h2>
      <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>

      {candidates.length === 0 ? (
        <p className="mt-5 rounded-xl border border-zinc-800 p-5 text-sm text-zinc-500">
          {t("none")}
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {candidates.map((item, index) => {
            const { checklist } = item;
            const isLong = checklist.direction === "LONG";
            const pct = Math.round(
              (checklist.metCount / Math.max(1, checklist.total)) * 100
            );
            const pending = checklist.pending
              .map((key) =>
                CONDITION_TITLE_KEY[key] ? tc(CONDITION_TITLE_KEY[key]) : null
              )
              .filter((label): label is string => label !== null);

            return (
              <li
                key={item.coin}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  {index === 0 && (
                    <span className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                      #1
                    </span>
                  )}
                  <span className="font-semibold text-white">
                    {item.coin.replace(/USDT$/, "")}
                  </span>
                  <Badge variant={isLong ? "green" : "red"}>
                    {checklist.direction}
                  </Badge>
                  <span className="ml-auto text-sm font-semibold text-white">
                    {checklist.metCount}/{checklist.total}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {pending.length > 0 && (
                  <p className="mt-3 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-500">
                      {t("waitingFor")}
                    </span>{" "}
                    {pending.join(" · ")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
