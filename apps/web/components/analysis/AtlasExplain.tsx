import { getLocale, getTranslations } from "next-intl/server";

import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";

type AtlasExplainProps = {
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  reasons: AtlasReasonCode[];
  warnings?: AtlasReasonCode[];
  explanation?: AtlasReasonCode;
  entry?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  riskRewardRatio?: number | null;
};

function formatPrice(
  value: number | null | undefined,
  locale: string
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString(locale, {
    maximumFractionDigits: value >= 1 ? 2 : 6,
  });
}

export default async function AtlasExplain({
  signal,
  confidence,
  reasons,
  warnings = [],
  explanation,
  entry,
  stopLoss,
  takeProfit,
  riskRewardRatio,
}: AtlasExplainProps) {
  const t = await getTranslations("AtlasExplain");
  const tReasons = await getTranslations("AtlasReasons");
  const locale = await getLocale();

  const accent =
    signal === "LONG"
      ? {
          text: "text-emerald-400",
          border: "border-emerald-500/40",
          mark: "text-emerald-400",
          dot: "bg-emerald-400",
        }
      : signal === "SHORT"
      ? {
          text: "text-red-400",
          border: "border-red-500/40",
          mark: "text-red-400",
          dot: "bg-red-400",
        }
      : {
          text: "text-amber-300",
          border: "border-amber-400/40",
          mark: "text-amber-300",
          dot: "bg-amber-300",
        };

  const verdictText = explanation
    ? resolveReasonText(tReasons, locale, explanation)
    : t("summaryFallback");

  const showLevels =
    signal !== "WAIT" &&
    (Number.isFinite(entry ?? NaN) ||
      Number.isFinite(stopLoss ?? NaN) ||
      Number.isFinite(takeProfit ?? NaN));

  const riskReward =
    riskRewardRatio != null &&
    Number.isFinite(riskRewardRatio)
      ? `${riskRewardRatio.toFixed(2)} : 1`
      : "—";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {t("eyebrow")}
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {t("whyChose", { signal })}
          </h2>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("confidence")}
          </p>

          <p className={`text-4xl font-bold tabular-nums ${accent.text}`}>
            {confidence}%
          </p>
        </div>
      </div>

      <div
        className={`mt-5 rounded-xl border-l-2 ${accent.border} bg-zinc-950/40 px-4 py-3.5`}
      >
        <p className="text-[15px] leading-7 text-zinc-200">
          {verdictText}
        </p>
      </div>

      {showLevels && (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              {t("entry")}
            </p>
            <p className="mt-1 font-semibold tabular-nums text-white">
              {formatPrice(entry, locale)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              {t("stopLoss")}
            </p>
            <p className="mt-1 font-semibold tabular-nums text-red-400">
              {formatPrice(stopLoss, locale)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              {t("takeProfit")}
            </p>
            <p className="mt-1 font-semibold tabular-nums text-emerald-400">
              {formatPrice(takeProfit, locale)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              {t("riskReward")}
            </p>
            <p className="mt-1 font-semibold tabular-nums text-white">
              {riskReward}
            </p>
          </div>
        </div>
      )}

      {reasons.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            {t("reasonsTitle")}
          </p>

          <ul className="mt-3 space-y-2.5">
            {reasons.map((reason, index) => (
              <li
                key={`${reason.code}-${index}`}
                className="flex items-start gap-3"
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`mt-0.5 h-4 w-4 shrink-0 ${accent.mark}`}
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10.5l4 4 8-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="text-[15px] leading-6 text-zinc-200">
                  {resolveReasonText(tReasons, locale, reason)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
            {t("risksTitle")}
          </p>

          <ul className="mt-3 space-y-2.5">
            {warnings.map((warning, index) => (
              <li
                key={`${warning.code}-${index}`}
                className="flex items-start gap-3"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />

                <span className="text-[15px] leading-6 text-zinc-300">
                  {resolveReasonText(tReasons, locale, warning)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
