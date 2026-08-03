"use client";

import { useLocale, useTranslations } from "next-intl";

type TradeSetup = {
  direction: string;
  entry: number | null;
  stopLoss: number | null;
  takeProfit1: number | null;
  takeProfit2: number | null;
  riskReward1: number | null;
  riskReward2: number | null;
  quality: string;
  explanation: string;
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

export default function AtlasTradeSetup({
  tradeSetup,
}: Props) {
  const t = useTranslations("AtlasTradeSetup");
  const locale = useLocale();

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
            {tradeSetup.explanation}
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

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            {t("stopLoss")}
          </p>

          <p className="mt-1 font-medium text-red-400">
            {formatPrice(tradeSetup.stopLoss, locale)}
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

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            {t("takeProfit1")}
          </p>

          <p className="mt-1 text-lg font-semibold text-emerald-400">
            {formatPrice(tradeSetup.takeProfit1, locale)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {formatRiskReward(t, tradeSetup.riskReward1)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            {t("takeProfit2")}
          </p>

          <p className="mt-1 text-lg font-semibold text-emerald-400">
            {formatPrice(tradeSetup.takeProfit2, locale)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {formatRiskReward(t, tradeSetup.riskReward2)}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-zinc-400">
        {tradeSetup.explanation}
      </p>
    </div>
  );
}