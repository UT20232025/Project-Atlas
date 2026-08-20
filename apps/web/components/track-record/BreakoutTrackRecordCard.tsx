import { getTranslations } from "next-intl/server";

import type { BreakoutTrackRecord } from "@/lib/atlas/breakoutTrackRecord";

export default async function BreakoutTrackRecordCard({
  record,
}: {
  record: BreakoutTrackRecord;
}) {
  const t = await getTranslations("BreakoutTrackRecord");

  return (
    <section className="atlas-card mb-8 rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">🚀 {t("title")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {record.total === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-400">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="atlas-subcard rounded-xl p-5 text-center">
            <p className="text-xs text-zinc-500">{t("winRate")}</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {record.winRate.toFixed(1)}%
            </p>
          </div>
          <div className="atlas-subcard rounded-xl p-5 text-center">
            <p className="text-xs text-zinc-500">{t("signals")}</p>
            <p className="mt-2 text-3xl font-bold text-white">{record.total}</p>
          </div>
          <div className="atlas-subcard rounded-xl p-5 text-center">
            <p className="text-xs text-zinc-500">{t("long")}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {record.long.total === 0
                ? "—"
                : `${record.long.winRate.toFixed(0)}%`}
            </p>
            <p className="mt-1 text-xs text-zinc-600">{record.long.total}</p>
          </div>
          <div className="atlas-subcard rounded-xl p-5 text-center">
            <p className="text-xs text-zinc-500">{t("short")}</p>
            <p className="mt-2 text-3xl font-bold text-red-400">
              {record.short.total === 0
                ? "—"
                : `${record.short.winRate.toFixed(0)}%`}
            </p>
            <p className="mt-1 text-xs text-zinc-600">{record.short.total}</p>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-600">{t("footnote")}</p>
    </section>
  );
}
