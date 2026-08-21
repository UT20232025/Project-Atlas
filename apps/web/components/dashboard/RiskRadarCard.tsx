import { getTranslations } from "next-intl/server";

import type { RiskRadar, RiskLevel } from "@/lib/atlas/riskRadar";

const LEVEL_STYLE: Record<
  RiskLevel,
  { ring: string; text: string; dot: string }
> = {
  LOW: {
    ring: "border-emerald-500/30 bg-emerald-500/5",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  ELEVATED: {
    ring: "border-amber-500/30 bg-amber-500/5",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  HIGH: {
    ring: "border-red-500/40 bg-red-500/10",
    text: "text-red-300",
    dot: "bg-red-400",
  },
};

const REASON_KEY: Record<string, string> = {
  BREAKDOWN: "reasonBreakdown",
  GREED: "reasonGreed",
  COMPRESSION: "reasonCompression",
  BTC_BEARISH: "reasonBtcBearish",
};

export default async function RiskRadarCard({
  radar,
}: {
  radar: RiskRadar;
}) {
  const t = await getTranslations("RiskRadar");
  const style = LEVEL_STYLE[radar.level];
  const levelLabel =
    radar.level === "HIGH"
      ? t("levelHigh")
      : radar.level === "ELEVATED"
        ? t("levelElevated")
        : t("levelLow");

  const bars: Array<{ label: string; value: number }> = [
    { label: t("breakdown"), value: radar.breakdown },
    { label: t("greed"), value: radar.greed },
    { label: t("compression"), value: radar.compression },
    { label: t("btcWeakness"), value: radar.btcWeakness },
  ];

  return (
    <div className={`rounded-2xl border p-6 ${style.ring}`}>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-white">🛡️ {t("title")}</h2>
        <span
          className={`ml-auto flex items-center gap-2 text-sm font-bold ${style.text}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
          {levelLabel} · {radar.score}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-400">{t("subtitle")}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
              <span>{bar.label}</span>
              <span>{bar.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${
                  bar.value >= 66
                    ? "bg-red-400"
                    : bar.value >= 34
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                }`}
                style={{ width: `${Math.min(100, bar.value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {radar.reasons.length > 0 ? (
        <p className="mt-4 text-xs text-zinc-400">
          <span className="font-medium text-zinc-500">{t("whyLabel")}</span>{" "}
          {radar.reasons
            .map((code) => (REASON_KEY[code] ? t(REASON_KEY[code]) : null))
            .filter((label): label is string => label !== null)
            .join(" · ")}
        </p>
      ) : (
        <p className="mt-4 text-xs text-zinc-500">{t("calmNote")}</p>
      )}

      <p className="mt-3 text-xs text-zinc-600">{t("footnote")}</p>
    </div>
  );
}
