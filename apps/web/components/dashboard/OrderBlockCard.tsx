"use client";

import { useLocale, useTranslations } from "next-intl";

import type { OrderBlockResult } from "@/lib/atlas/orderBlockEngine";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";

type OrderBlockCardProps = {
  orderBlocks: OrderBlockResult;
};

function formatPrice(t: ReturnType<typeof useTranslations>, price: number | null, locale: string): string {
  if (price === null) {
    return t("notAvailable");
  }

  return price.toLocaleString(locale, {
    maximumFractionDigits: 5,
  });
}

export default function OrderBlockCard({
  orderBlocks,
}: OrderBlockCardProps) {
  const t = useTranslations("OrderBlockCard");
  const c = useTranslations("Cards");
  const tReasons = useTranslations("AtlasReasons");
  const locale = useLocale();

  const bullish =
    orderBlocks.nearestBullishOrderBlock;

  const bearish =
    orderBlocks.nearestBearishOrderBlock;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          {t("title")}
        </p>

        <p className="mt-2 text-sm text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("bullishOrderBlock")}
          </p>

          {bullish ? (
            <>
              <p className="mt-2 text-xl font-semibold text-emerald-400">
                {formatPrice(c, bullish.low, locale)} –{" "}
                {formatPrice(c, bullish.high, locale)}
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {c("midpointColon")}{" "}
                <span className="text-zinc-200">
                  {formatPrice(c, bullish.midpoint, locale)}
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                {c("strengthColon")}{" "}
                <span className="text-emerald-300">
                  {bullish.strength}/100
                </span>
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              {t("noBullish")}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("bearishOrderBlock")}
          </p>

          {bearish ? (
            <>
              <p className="mt-2 text-xl font-semibold text-red-400">
                {formatPrice(c, bearish.low, locale)} –{" "}
                {formatPrice(c, bearish.high, locale)}
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {c("midpointColon")}{" "}
                <span className="text-zinc-200">
                  {formatPrice(c, bearish.midpoint, locale)}
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                {c("strengthColon")}{" "}
                <span className="text-red-300">
                  {bearish.strength}/100
                </span>
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              {t("noBearish")}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        {resolveReasonText(tReasons, locale, orderBlocks.summary)}
      </p>
    </div>
  );
}