import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import Badge from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth/session";
import { getMarketTicker } from "@/lib/services/dashboardService";
import { getStockScannerFromDb } from "@/lib/stocks/stockScanner";
import {
  getCurrentUser,
  hasActiveSubscription,
} from "@/lib/subscription/requirePro";

const CONDITION_TITLE_KEY: Record<string, string> = {
  trend: "trendTitle",
  timeframes: "timeframesTitle",
  structure: "structureTitle",
  liquidity: "liquidityTitle",
  momentum: "momentumTitle",
};

function signalVariant(signal: string): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

export default async function StocksPage() {
  const { email } = await requireSession();
  const user = await getCurrentUser();
  const isPro = hasActiveSubscription(user);

  const t = await getTranslations("Stocks");
  const tc = await getTranslations("TradeChecklist");
  const locale = await getLocale();

  const [ticker, stocks] = await Promise.all([
    getMarketTicker(),
    getStockScannerFromDb(),
  ]);

  return (
    <AppLayout marketTicker={ticker} userEmail={email} isPro={isPro}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {stocks.length === 0 ? (
        <div className="atlas-card rounded-2xl p-8 text-center text-sm text-zinc-500">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stocks.map((stock) => {
            const pct = Math.round(
              (stock.checklist.metCount /
                Math.max(1, stock.checklist.total)) *
                100
            );
            const pending = stock.checklist.pending
              .map((key) =>
                CONDITION_TITLE_KEY[key]
                  ? tc(CONDITION_TITLE_KEY[key])
                  : null
              )
              .filter((label): label is string => label !== null);

            return (
              <Link
                key={stock.ticker}
                href={`/coin/${stock.ticker}`}
                className="atlas-card rounded-2xl p-5 transition hover:border-zinc-600"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-bold text-white">
                    {stock.ticker}
                  </span>
                  <Badge variant={signalVariant(stock.signal)}>
                    {stock.signal}
                  </Badge>
                  <span className="ml-auto text-sm text-zinc-500">
                    {stock.price != null
                      ? stock.price.toLocaleString(locale, {
                          style: "currency",
                          currency: "USD",
                        })
                      : "—"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${
                        stock.checklist.ready
                          ? "bg-emerald-400"
                          : "bg-gradient-to-r from-cyan-400 to-blue-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {stock.checklist.metCount}/{stock.checklist.total}
                  </span>
                </div>

                {stock.signal === "WAIT" && pending.length > 0 && (
                  <p className="mt-3 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-500">
                      {t("waitingFor")}
                    </span>{" "}
                    {pending.join(" · ")}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-zinc-600">
        {t("footnote")}
      </p>
    </AppLayout>
  );
}
