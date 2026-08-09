"use client";

import { useLocale, useTranslations } from "next-intl";

import type { PriceAlertView } from "@/lib/alerts/priceAlerts";

type PriceAlertsProps = {
  symbol: string;
  displaySymbol: string;
  currentPrice: number;
  alerts: PriceAlertView[];
  createAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
};

export default function PriceAlerts({
  symbol,
  displaySymbol,
  currentPrice,
  alerts,
  createAction,
  deleteAction,
}: PriceAlertsProps) {
  const t = useTranslations("PriceAlerts");
  const locale = useLocale();

  const formatPrice = (value: number) =>
    value.toLocaleString(locale, {
      maximumFractionDigits: value >= 1 ? 2 : 6,
    });

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xl">🔔</span>
        <div>
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <p className="text-sm text-zinc-500">
            {t("subtitle", { symbol: displaySymbol })}
          </p>
        </div>
      </div>

      <form
        action={createAction}
        className="flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="symbol" value={symbol} />

        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          {t("direction")}
          <select
            name="direction"
            defaultValue="ABOVE"
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="ABOVE">{t("above")}</option>
            <option value="BELOW">{t("below")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          {t("targetPrice")}
          <input
            type="number"
            name="targetPrice"
            step="any"
            required
            defaultValue={currentPrice}
            className="w-40 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </label>

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          {t("add")}
        </button>

        <span className="pb-2.5 text-xs text-zinc-600">
          {t("now")} {formatPrice(currentPrice)}
        </span>
      </form>

      {alerts.length > 0 && (
        <ul className="mt-4 space-y-2">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2.5 text-sm"
            >
              <span className="text-zinc-300">
                <span
                  className={
                    alert.direction === "ABOVE"
                      ? "font-semibold text-emerald-400"
                      : "font-semibold text-red-400"
                  }
                >
                  {alert.direction === "ABOVE" ? t("above") : t("below")}
                </span>{" "}
                {formatPrice(alert.targetPrice)}
              </span>

              <form action={deleteAction}>
                <input type="hidden" name="alertId" value={alert.id} />
                <input type="hidden" name="symbol" value={symbol} />
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition hover:border-red-500 hover:text-red-300"
                  aria-label={t("remove")}
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
