"use client";

import { useTranslations } from "next-intl";

import type {
  FairValueGapResult,
} from "@/lib/atlas/fairValueGapEngine";

type FairValueGapCardProps = {
  fairValueGaps: FairValueGapResult;
};

export default function FairValueGapCard({
  fairValueGaps,
}: FairValueGapCardProps) {
  const t = useTranslations("FairValueGapCard");
  const c = useTranslations("Cards");

  return (
    <div className="space-y-2 text-sm">
      <p className="text-zinc-400">
        {fairValueGaps.summary}
      </p>

      <p className="text-emerald-400">
        {t("bullish")}{" "}
        {fairValueGaps.bullishFairValueGaps.length}
      </p>

      <p className="text-red-400">
        {t("bearish")}{" "}
        {fairValueGaps.bearishFairValueGaps.length}
      </p>

      <p className="text-zinc-300">
        {t("nearestBullish")}{" "}
        {fairValueGaps.nearestBullishFairValueGap
          ? fairValueGaps.nearestBullishFairValueGap.midpoint.toFixed(2)
          : c("none")}
      </p>{fairValueGaps.nearestBullishFairValueGap && (
  <p className="text-xs text-zinc-500">
    {c("strengthColon")}{" "}
    {fairValueGaps.nearestBullishFairValueGap.strength}%
  </p>
)}

      <p className="text-zinc-300">
        {t("nearestBearish")}{" "}
        {fairValueGaps.nearestBearishFairValueGap
          ? fairValueGaps.nearestBearishFairValueGap.midpoint.toFixed(2)
          : c("none")}
      </p>{fairValueGaps.nearestBearishFairValueGap && (
  <p className="text-xs text-zinc-500">
    {c("strengthColon")}{" "}
    {fairValueGaps.nearestBearishFairValueGap.strength}%
  </p>
)}
    </div>
  );
}