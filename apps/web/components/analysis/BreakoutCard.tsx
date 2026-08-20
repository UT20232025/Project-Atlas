import { getTranslations } from "next-intl/server";

import type { BreakoutResult } from "@/lib/atlas/breakoutEngine";

// A prominent, time-sensitive card shown only when the momentum engine detects a
// breakout firing right now — the thing the conservative MTF signal misses.
export default async function BreakoutCard({
  breakout,
}: {
  breakout: BreakoutResult;
}) {
  const t = await getTranslations("Breakout");

  // Pre-breakout: volatility is coiling. A subtler "charging up" heads-up.
  if (!breakout.detected || breakout.direction === null) {
    if (breakout.coiling) {
      return (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-300">
            ⚡ {t("coilingTitle")}
          </p>
          <p className="mt-1 text-xs text-zinc-400">{t("coilingNote")}</p>
        </div>
      );
    }
    return null;
  }

  const isLong = breakout.direction === "LONG";

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isLong
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-red-500/40 bg-red-500/10"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-lg font-bold text-white">
          🚀 {t("title")}
        </span>
        <span
          className={`rounded-full px-3 py-0.5 text-sm font-semibold ${
            isLong
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {isLong ? t("longLabel") : t("shortLabel")}
        </span>
        <span className="ml-auto text-sm text-zinc-400">
          {t("strength")}: {breakout.strength}
        </span>
      </div>

      <p className="mt-3 text-sm text-zinc-300">
        {t("note", {
          expansion: breakout.rangeExpansion.toFixed(1),
          volume:
            breakout.volumeSurge != null
              ? breakout.volumeSurge.toFixed(1)
              : "—",
        })}
      </p>

      <p className="mt-2 text-xs text-zinc-500">{t("riskNote")}</p>
    </div>
  );
}
