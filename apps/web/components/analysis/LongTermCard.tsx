import { getTranslations } from "next-intl/server";

import type { LongTermSignal } from "@/lib/atlas/longTermSignal";

const STANCE_STYLE: Record<string, { text: string; ring: string }> = {
  ACCUMULATE: { text: "text-emerald-300", ring: "border-emerald-500/30 bg-emerald-500/5" },
  HOLD: { text: "text-amber-300", ring: "border-amber-500/30 bg-amber-500/5" },
  REDUCE: { text: "text-red-300", ring: "border-red-500/30 bg-red-500/5" },
  INSUFFICIENT: { text: "text-zinc-400", ring: "border-zinc-800 bg-zinc-950/40" },
};

function fmt(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (v >= 1) return String(Math.round(v * 100) / 100);
  return String(Math.round(v * 100000000) / 100000000);
}

export default async function LongTermCard({
  signal,
}: {
  signal: LongTermSignal;
}) {
  const t = await getTranslations("LongTerm");
  const style = STANCE_STYLE[signal.stance] ?? STANCE_STYLE.INSUFFICIENT;

  if (signal.stance === "INSUFFICIENT") {
    return null; // not enough history (e.g. a very new listing)
  }

  const stanceLabel =
    signal.stance === "ACCUMULATE"
      ? t("stanceAccumulate")
      : signal.stance === "REDUCE"
        ? t("stanceReduce")
        : t("stanceHold");

  return (
    <div className={`rounded-2xl border p-5 ${style.ring}`}>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-white">📈 {t("title")}</h3>
        <span className={`ml-auto text-sm font-bold ${style.text}`}>
          {stanceLabel}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-zinc-500">{t("vs200")}</p>
          <p
            className={`mt-1 font-semibold ${
              (signal.pctVs200 ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {(signal.pctVs200 ?? 0) >= 0 ? "+" : ""}
            {(signal.pctVs200 ?? 0).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">{t("cross")}</p>
          <p className="mt-1 font-semibold text-white">
            {signal.goldenCross ? t("golden") : t("death")}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">{t("trend200")}</p>
          <p className="mt-1 font-semibold text-white">
            {signal.rising ? t("rising") : t("falling")}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">200-SMA</p>
          <p className="mt-1 font-semibold text-white">{fmt(signal.sma200)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <p className="text-xs text-zinc-500">{t("holdTarget")}</p>
        {signal.atHigh ? (
          <p className="mt-1 font-semibold text-emerald-300">{t("blueSky")}</p>
        ) : (
          <p className="mt-1 text-sm text-zinc-300">
            <span className="font-bold text-white">{fmt(signal.cycleHigh)}</span>{" "}
            <span className="text-emerald-300">
              (+{(signal.upsideToHigh ?? 0).toFixed(0)}% {t("upside")})
            </span>
          </p>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600">{t("footnote")}</p>
    </div>
  );
}
