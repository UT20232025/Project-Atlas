"use client";

import { useTranslations } from "next-intl";

import type { VolumeAnalysisResult } from "@/lib/atlas/volumeEngine";

type Props = {
  volume: VolumeAnalysisResult;
};

function getPressureColor(
  pressure: VolumeAnalysisResult["pressure"]
) {
  switch (pressure) {
    case "BULLISH":
      return "text-emerald-400";

    case "BEARISH":
      return "text-red-400";

    default:
      return "text-amber-300";
  }
}

export default function VolumeAnalysisCard({
  volume,
}: Props) {
  const t = useTranslations("VolumeAnalysisCard");
  const c = useTranslations("Cards");

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
          className={`text-lg font-semibold ${getPressureColor(
            volume.pressure
          )}`}
        >
          {volume.pressure}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("relativeVolume")}
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {volume.relativeVolume.toFixed(2)}x
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {c("confidence")}
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {volume.confidence}%
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("trend")}
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {volume.volumeTrend}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("bullishVolume")}
          </p>

          <p className="mt-2 text-lg font-semibold text-emerald-400">
            {Math.round(volume.bullishVolume).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("bearishVolume")}
          </p>

          <p className="mt-2 text-lg font-semibold text-red-400">
            {Math.round(volume.bearishVolume).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("volumeSpike")}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {volume.spike ? c("yes") : c("no")}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("confirmation")}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {volume.confirmation}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          {c("atlasExplanation")}
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {volume.explanation}
        </p>
      </div>
    </div>
  );
}