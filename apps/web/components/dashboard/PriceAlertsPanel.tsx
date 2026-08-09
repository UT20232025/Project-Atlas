import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import type {
  PriceAlertView,
  TriggeredAlert,
} from "@/lib/alerts/priceAlerts";

const displaySymbol = (symbol: string) => symbol.replace(/USDT$/, "");

type PriceAlertsPanelProps = {
  triggered: TriggeredAlert[];
  active: Array<PriceAlertView & { price: number | null }>;
};

export default async function PriceAlertsPanel({
  triggered,
  active,
}: PriceAlertsPanelProps) {
  if (triggered.length === 0 && active.length === 0) {
    return null;
  }

  const t = await getTranslations("PriceAlerts");
  const locale = await getLocale();

  const fmt = (value: number | null) =>
    value === null
      ? "—"
      : value.toLocaleString(locale, {
          maximumFractionDigits: value >= 1 ? 2 : 6,
        });

  const dirLabel = (direction: "ABOVE" | "BELOW") =>
    direction === "ABOVE" ? t("above") : t("below");

  return (
    <section className="atlas-card mb-8 rounded-2xl p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-2xl">🔔</span>
        <div>
          <h2 className="text-2xl font-bold">{t("panelTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {t("panelSubtitle")}
          </p>
        </div>
      </div>

      {triggered.length > 0 && (
        <ul className="mb-3 space-y-2">
          {triggered.map((alert) => (
            <li key={alert.id}>
              <Link
                href={`/coin/${alert.symbol}`}
                className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 transition hover:border-blue-500"
              >
                <span className="text-sm text-white">
                  {t("hit", {
                    symbol: displaySymbol(alert.symbol),
                    direction: dirLabel(alert.direction),
                    target: fmt(alert.targetPrice),
                  })}
                </span>
                <span className="text-sm font-semibold text-blue-300">
                  {fmt(alert.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {active.length > 0 && (
        <ul className="space-y-2">
          {active.map((alert) => (
            <li key={alert.id}>
              <Link
                href={`/coin/${alert.symbol}`}
                className="atlas-subcard flex items-center justify-between rounded-xl px-4 py-3 transition hover:border-blue-500"
              >
                <span className="text-sm text-zinc-300">
                  <span className="font-semibold text-white">
                    {displaySymbol(alert.symbol)}
                  </span>{" "}
                  <span
                    className={
                      alert.direction === "ABOVE"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {dirLabel(alert.direction)}
                  </span>{" "}
                  {fmt(alert.targetPrice)}
                </span>
                <span className="text-xs text-zinc-500">
                  {t("now")} {fmt(alert.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
