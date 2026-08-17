import { getTranslations } from "next-intl/server";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import Badge from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth/session";
import { getMarketTicker } from "@/lib/services/dashboardService";
import { getForexScannerFromDb } from "@/lib/stocks/stockScanner";
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

// Internal symbols are slash-free (XAUUSD); show them as pairs (XAU/USD).
function formatPair(ticker: string): string {
  return ticker.length === 6
    ? `${ticker.slice(0, 3)}/${ticker.slice(3)}`
    : ticker;
}

// FX rates and gold live on very different scales (EUR/USD ~1.08, USD/JPY ~150,
// XAU/USD ~2400), so pick decimals by magnitude rather than a fixed currency.
function formatPrice(price: number): string {
  const decimals = price < 10 ? 4 : 2;
  return price.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default async function GoldForexPage() {
  const { email } = await requireSession();
  const user = await getCurrentUser();
  const isPro = hasActiveSubscription(user);

  const t = await getTranslations("GoldForex");
  const tc = await getTranslations("TradeChecklist");

  const [ticker, assets] = await Promise.all([
    getMarketTicker(),
    getForexScannerFromDb(),
  ]);

  return (
    <AppLayout marketTicker={ticker} userEmail={email} isPro={isPro}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {assets.length === 0 ? (
        <div className="atlas-card rounded-2xl p-8 text-center text-sm text-zinc-500">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assets.map((asset) => {
            const pct = Math.round(
              (asset.checklist.metCount /
                Math.max(1, asset.checklist.total)) *
                100
            );
            const pending = asset.checklist.pending
              .map((key) =>
                CONDITION_TITLE_KEY[key]
                  ? tc(CONDITION_TITLE_KEY[key])
                  : null
              )
              .filter((label): label is string => label !== null);

            return (
              <Link
                key={asset.ticker}
                href={`/coin/${asset.ticker}`}
                className="atlas-card rounded-2xl p-5 transition hover:border-zinc-600"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-bold text-white">
                    {formatPair(asset.ticker)}
                  </span>
                  <Badge variant={signalVariant(asset.signal)}>
                    {asset.signal}
                  </Badge>
                  <span className="ml-auto text-sm text-zinc-500">
                    {asset.price != null ? formatPrice(asset.price) : "—"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${
                        asset.checklist.ready
                          ? "bg-emerald-400"
                          : "bg-gradient-to-r from-cyan-400 to-blue-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {asset.checklist.metCount}/{asset.checklist.total}
                  </span>
                </div>

                {asset.signal === "WAIT" && pending.length > 0 && (
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
