"use client";

import { useTranslations } from "next-intl";

import type { MarketStructureResult } from "@/lib/atlas/marketStructureEngine";

type Props = {
  structure: MarketStructureResult;
};

function getTrendColor(
  trend: MarketStructureResult["trend"]
): string {
  if (trend === "BULLISH") {
    return "text-emerald-400";
  }

  if (trend === "BEARISH") {
    return "text-red-400";
  }

  return "text-amber-300";
}

function formatPrice(
  value: number | null
): string {
  if (value === null) {
    return "N/A";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

export default function MarketStructureCard({
  structure,
}: Props) {
  const t = useTranslations("MarketStructureCard");
  const c = useTranslations("Cards");

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("title")}
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            {t("subtitle")}
          </h3>
        </div>

        <div
          className={`text-lg font-semibold ${getTrendColor(
            structure.trend
          )}`}
        >
          {structure.trend}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("event")}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {structure.event}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {c("strength")}
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {structure.strength}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {c("confidence")}
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {structure.confidence}%
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("latestSwingHigh")}
          </p>

          <p className="mt-2 text-lg font-semibold text-emerald-400">
            {formatPrice(
              structure.latestSwingHigh
            )}
          </p>

          <p className="mt-2 text-sm text-zinc-400">
            {structure.swingHighType ??
              c("noClassification")}
          </p>
        </div>

        <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("latestSwingLow")}
          </p>

          <p className="mt-2 text-lg font-semibold text-red-400">
            {formatPrice(
              structure.latestSwingLow
            )}
          </p>

          <p className="mt-2 text-sm text-zinc-400">
            {structure.swingLowType ??
              c("noClassification")}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("bullishBreak")}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {structure.bullishBreak
              ? c("yes")
              : c("no")}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("bearishBreak")}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {structure.bearishBreak
              ? c("yes")
              : c("no")}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          {c("atlasExplanation")}
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {structure.explanation}
        </p>
      </div>
    </div>
  );
}