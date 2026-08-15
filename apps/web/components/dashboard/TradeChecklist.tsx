"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";

type ChecklistItemKey =
  | "trend"
  | "timeframes"
  | "structure"
  | "liquidity"
  | "momentum";

type ChecklistItem = {
  key: ChecklistItemKey;
  met: boolean;
};

export type TradeChecklistData = {
  direction: "LONG" | "SHORT";
  items: ChecklistItem[];
  metCount: number;
  total: number;
  ready: boolean;
};

export default function TradeChecklist({
  checklist,
}: {
  checklist: TradeChecklistData;
}) {
  const t = useTranslations("TradeChecklist");

  const isLong = checklist.direction === "LONG";
  const pct = Math.round(
    (checklist.metCount / Math.max(1, checklist.total)) * 100
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          {t("title")}
        </p>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            isLong
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-red-500/15 text-red-300"
          }`}
        >
          {isLong ? t("setupLong") : t("setupShort")}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${
              checklist.ready
                ? "bg-emerald-400"
                : "bg-gradient-to-r from-cyan-400 to-blue-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-semibold text-white">
          {t("progress", {
            met: checklist.metCount,
            total: checklist.total,
          })}
        </span>
      </div>

      {/* Items */}
      <ul className="mt-5 space-y-3">
        {checklist.items.map((item) => (
          <li key={item.key} className="flex items-start gap-3">
            {item.met ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-zinc-600" />
            )}

            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  item.met ? "text-zinc-200" : "text-zinc-400"
                }`}
              >
                {t(`${item.key}Title`)}
              </p>

              <p
                className={`mt-0.5 text-xs ${
                  item.met ? "text-emerald-400/80" : "text-zinc-500"
                }`}
              >
                {item.met ? t("metLabel") : t(`${item.key}Waiting`)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p
        className={`mt-5 text-sm font-medium ${
          checklist.ready ? "text-emerald-400" : "text-zinc-400"
        }`}
      >
        {checklist.ready ? t("ready") : t("waitingMore")}
      </p>
    </div>
  );
}
