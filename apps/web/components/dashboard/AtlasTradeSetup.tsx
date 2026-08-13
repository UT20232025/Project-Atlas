"use client";

import { useLocale, useTranslations } from "next-intl";

import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";

type StopLossOption = {
  price: number;
  type: "STRUCTURE" | "ATR";
  distance: "TIGHT" | "WIDE" | null;
  isPrimary: boolean;
  riskReward1: number | null;
  riskReward2: number | null;
  riskReward3: number | null;
};

type TradeSetup = {
  direction: string;
  entry: number | null;
  stopLoss: number | null;
  stops: StopLossOption[];
  takeProfit1: number | null;
  takeProfit2: number | null;
  takeProfit3: number | null;
  riskReward1: number | null;
  riskReward2: number | null;
  riskReward3: number | null;
  quality: string;
  explanation: AtlasReasonCode[];
};

type Props = {
  tradeSetup: TradeSetup;
};

function formatPrice(price: number | null, locale: string) {
  if (price === null || !Number.isFinite(price)) {
    return "—";
  }

  return price.toLocaleString(locale, {
    maximumFractionDigits: 2,
  });
}

function formatRiskReward(t: ReturnType<typeof useTranslations>, value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return t("rr", { value: `${value.toFixed(2)}:1` });
}

function getDirectionTextColor(direction: string) {
  if (direction === "LONG") {
    return "text-emerald-400";
  }

  if (direction === "SHORT") {
    return "text-red-400";
  }

  return "text-amber-300";
}

function getQualityTextColor(quality: string) {
  if (quality === "A") {
    return "text-emerald-400";
  }

  if (quality === "B") {
    return "text-sky-400";
  }

  if (quality === "C") {
    return "text-amber-300";
  }

  return "text-zinc-400";
}

function getStopTypeLabel(
  t: ReturnType<typeof useTranslations>,
  type: StopLossOption["type"]
) {
  return type === "STRUCTURE"
    ? t("stopStructure")
    : t("stopAtr");
}

function getStopDistanceLabel(
  t: ReturnType<typeof useTranslations>,
  distance: StopLossOption["distance"]
) {
  if (distance === "TIGHT") {
    return t("stopTight");
  }

  if (distance === "WIDE") {
    return t("stopWide");
  }

  return null;
}

function StopCard({
  stop,
  t,
  locale,
}: {
  stop: StopLossOption;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const distanceLabel = getStopDistanceLabel(
    t,
    stop.distance
  );

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium text-zinc-400">
          {getStopTypeLabel(t, stop.type)}
        </p>

        {distanceLabel && (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
            {distanceLabel}
          </span>
        )}

        {stop.isPrimary && (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
            {t("stopRecommended")}
          </span>
        )}
      </div>

      <p className="mt-1 text-lg font-semibold text-red-400">
        {formatPrice(stop.price, locale)}
      </p>

      <p className="mt-2 text-xs text-zinc-500">
        {t("takeProfit1")}: {formatRiskReward(t, stop.riskReward1)}
        {" · "}
        {t("takeProfit2")}: {formatRiskReward(t, stop.riskReward2)}
        {" · "}
        {t("takeProfit3")}: {formatRiskReward(t, stop.riskReward3)}
      </p>
    </div>
  );
}

export default function AtlasTradeSetup({
  tradeSetup,
}: Props) {
  const t = useTranslations("AtlasTradeSetup");
  const tReasons = useTranslations("AtlasReasons");
  const locale = useLocale();

  const explanationText = tradeSetup.explanation
    .map((part) => resolveReasonText(tReasons, locale, part))
    .join(" ");

  const stopOptions: StopLossOption[] =
    tradeSetup.stops.length > 0
      ? tradeSetup.stops
      : tradeSetup.stopLoss !== null
        ? [
            {
              price: tradeSetup.stopLoss,
              type: "ATR",
              distance: null,
              isPrimary: true,
              riskReward1: tradeSetup.riskReward1,
              riskReward2: tradeSetup.riskReward2,
              riskReward3: tradeSetup.riskReward3,
            },
          ]
        : [];

  const isNoTrade =
    tradeSetup.direction === "WAIT" ||
    tradeSetup.quality === "NO_TRADE";

  if (isNoTrade) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          {t("title")}
        </p>

        <div className="mt-4 rounded-lg border border-amber-500/20 bg-zinc-950/30 p-4">
          <p className="text-lg font-semibold text-amber-300">
            {t("noTrade")}
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {explanationText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        {t("title")}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-zinc-500">
            {t("direction")}
          </p>

          <p
            className={`mt-1 text-lg font-semibold ${getDirectionTextColor(
              tradeSetup.direction
            )}`}
          >
            {tradeSetup.direction}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            {t("entry")}
          </p>

          <p className="mt-1 font-medium text-white">
            {formatPrice(tradeSetup.entry, locale)}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            {t("quality")}
          </p>

          <p
            className={`mt-1 font-medium ${getQualityTextColor(
              tradeSetup.quality
            )}`}
          >
            {tradeSetup.quality}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs text-zinc-500">
          {t("stopLoss")}
        </p>

        <div className="mt-2 grid gap-4 md:grid-cols-2">
          {stopOptions.map((stop, index) => (
            <StopCard
              key={`${stop.type}-${index}`}
              stop={stop}
              t={t}
              locale={locale}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500">
              {t("takeProfit1")}
            </p>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
              {t("tpTagConservative")}
            </span>
          </div>

          <p className="mt-1 text-lg font-semibold text-emerald-400">
            {formatPrice(tradeSetup.takeProfit1, locale)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {formatRiskReward(t, tradeSetup.riskReward1)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500">
              {t("takeProfit2")}
            </p>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
              {t("tpTagBase")}
            </span>
          </div>

          <p className="mt-1 text-lg font-semibold text-emerald-400">
            {formatPrice(tradeSetup.takeProfit2, locale)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {formatRiskReward(t, tradeSetup.riskReward2)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500">
              {t("takeProfit3")}
            </p>
            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-300">
              {t("tpTagRunner")}
            </span>
          </div>

          <p className="mt-1 text-lg font-semibold text-emerald-400">
            {formatPrice(tradeSetup.takeProfit3, locale)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {formatRiskReward(t, tradeSetup.riskReward3)}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-zinc-400">
        {explanationText}
      </p>
    </div>
  );
}