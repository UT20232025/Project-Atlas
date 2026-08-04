"use client";

import { useLocale, useTranslations } from "next-intl";

import type {
  AtlasMtfResult,
  AtlasTimeframe,
} from "@/lib/atlas/multiTimeframeEngine";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";

type Props = {
  mtf: AtlasMtfResult;
};

function getSignalColor(signal: string) {
  switch (signal) {
    case "STRONG_LONG":
    case "LONG":
      return "text-emerald-400";

    case "STRONG_SHORT":
    case "SHORT":
      return "text-red-400";

    default:
      return "text-amber-300";
  }
}

function getTrendColor(direction: string) {
  if (direction.includes("BULL")) {
    return "text-emerald-400";
  }

  if (direction.includes("BEAR")) {
    return "text-red-400";
  }

  return "text-zinc-400";
}

function getTimeframeLabelCode(
  timeframe: AtlasTimeframe
): string {
  switch (timeframe) {
    case "15m":
      return "MTF_TIMEFRAME_LABEL_15M";

    case "1h":
      return "MTF_TIMEFRAME_LABEL_1H";

    case "4h":
      return "MTF_TIMEFRAME_LABEL_4H";
  }
}

export default function MultiTimeframeCard({
  mtf,
}: Props) {
  const t = useTranslations("MultiTimeframeCard");
  const c = useTranslations("Cards");
  const tReasons = useTranslations("AtlasReasons");
  const locale = useLocale();

  const timeframeSummary = mtf.timeframeResults
    .map(
      (result) =>
        `${tReasons(getTimeframeLabelCode(result.timeframe))}: ${result.signal}`
    )
    .join(", ");

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("title")}
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            {t("subtitle")}
          </h3>
        </div>

        <div
          className={`text-lg font-semibold ${getSignalColor(
            mtf.signal
          )}`}
        >
          {mtf.signal}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {c("confidence")}
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {mtf.confidence}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("agreement")}
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {mtf.agreement}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("bullish")}
          </p>

          <p className="mt-2 text-xl font-semibold text-emerald-400">
            {mtf.bullishScore}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("bearish")}
          </p>

          <p className="mt-2 text-xl font-semibold text-red-400">
            {mtf.bearishScore}%
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-zinc-500">
            <tr className="border-b border-zinc-800">
              <th className="py-2 text-left">{t("tf")}</th>
              <th className="py-2 text-left">{t("role")}</th>
              <th className="py-2 text-left">{t("signal")}</th>
              <th className="py-2 text-left">{t("trend")}</th>
              <th className="py-2 text-left">{c("confidence")}</th>
              <th className="py-2 text-left">{t("weight")}</th>
            </tr>
          </thead>

          <tbody>
            {mtf.timeframeResults.map((tf) => (
              <tr
                key={tf.timeframe}
                className="border-b border-zinc-900"
              >
                <td className="py-3 font-semibold text-white">
                  {tf.timeframe}
                </td>

                <td className="py-3 text-zinc-400">
                  {tf.role}
                </td>

                <td
                  className={`py-3 font-semibold ${getSignalColor(
                    tf.signal
                  )}`}
                >
                  {tf.signal}
                </td>

                <td
                  className={`py-3 ${getTrendColor(
                    tf.trendDirection
                  )}`}
                >
                  {tf.trendDirection}
                </td>

                <td className="py-3 text-white">
                  {tf.confidence}%
                </td>

                <td className="py-3 text-white">
                  {tf.weight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div
          className={`rounded-xl border p-4 ${
            mtf.aligned
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-zinc-800 bg-zinc-950/40"
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("alignment")}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {mtf.aligned ? t("aligned") : t("notAligned")}
          </p>
        </div>

        <div
          className={`rounded-xl border p-4 ${
            mtf.conflict
              ? "border-red-500/20 bg-red-500/5"
              : "border-zinc-800 bg-zinc-950/40"
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("conflict")}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {mtf.conflict ? c("yes") : c("no")}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          {c("atlasExplanation")}
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {resolveReasonText(tReasons, locale, mtf.explanation)}{" "}
          {timeframeSummary}.
        </p>
      </div>
    </div>
  );
}