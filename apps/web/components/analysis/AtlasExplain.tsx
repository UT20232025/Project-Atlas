import { getLocale, getTranslations } from "next-intl/server";

import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";

type AtlasExplainProps = {
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  reasons: AtlasReasonCode[];
  warnings?: AtlasReasonCode[];
  explanation?: AtlasReasonCode;
};

export default async function AtlasExplain({
  signal,
  confidence,
  reasons,
  warnings = [],
  explanation,
}: AtlasExplainProps) {
  const t = await getTranslations("AtlasExplain");
  const tReasons = await getTranslations("AtlasReasons");
  const locale = await getLocale();

  const signalColor =
    signal === "LONG"
      ? "text-green-400"
      : signal === "SHORT"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t("whyChose", { signal })}
          </h2>

          <p className="mt-1 text-zinc-500">
            {t("subtitle")}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-zinc-500">
            {t("confidence")}
          </p>

          <p className={`text-4xl font-bold ${signalColor}`}>
            {confidence}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {reasons.map((reason, index) => (
          <div
            key={index}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex gap-3">
              <span className="text-green-400">✓</span>

              <p>{resolveReasonText(tReasons, locale, reason)}</p>
            </div>
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 space-y-3">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4"
            >
              <div className="flex gap-3">
                <span className="text-yellow-400">⚠</span>

                <p className="text-zinc-300">{resolveReasonText(tReasons, locale, warning)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <p className="font-semibold text-blue-300">
          {t("summaryTitle")}
        </p>

        <p className="mt-2 text-zinc-300 leading-7">
          {explanation ? resolveReasonText(tReasons, locale, explanation) : t("summaryFallback")}
        </p>
      </div>
    </section>
  );
}
