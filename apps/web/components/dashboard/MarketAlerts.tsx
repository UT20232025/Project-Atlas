import { getTranslations } from "next-intl/server";

import type { ScannerItem } from "../../lib/analysis/scanner";

type MarketAlertsProps = {
  items: ScannerItem[];
};

type AlertItem = {
  coin: string;
  tone: "green" | "red" | "yellow" | "blue";
  key: "alertStrongLong" | "alertStrongShort" | "alertRsiOverbought" | "alertRsiOversold" | "alertBullishMove";
  values: Record<string, string | number>;
};

function buildAlerts(items: ScannerItem[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const item of items) {
    if (item.confidence >= 90 && item.signal === "LONG") {
      alerts.push({
        coin: item.coin,
        key: "alertStrongLong",
        values: { confidence: item.confidence },
        tone: "green",
      });
    }

    if (item.confidence >= 90 && item.signal === "SHORT") {
      alerts.push({
        coin: item.coin,
        key: "alertStrongShort",
        values: { confidence: item.confidence },
        tone: "red",
      });
    }

    if (item.rsi >= 70) {
      alerts.push({
        coin: item.coin,
        key: "alertRsiOverbought",
        values: { rsi: item.rsi.toFixed(1) },
        tone: "red",
      });
    }

    if (item.rsi <= 30) {
      alerts.push({
        coin: item.coin,
        key: "alertRsiOversold",
        values: { rsi: item.rsi.toFixed(1) },
        tone: "green",
      });
    }

    if (item.trend === "BULLISH" && item.change24h > 5) {
      alerts.push({
        coin: item.coin,
        key: "alertBullishMove",
        values: { change: item.change24h.toFixed(2) },
        tone: "blue",
      });
    }
  }

  return alerts.slice(0, 6);
}

export default async function MarketAlerts({
  items,
}: MarketAlertsProps) {
  const t = await getTranslations("MarketAlerts");
  const alerts = buildAlerts(items);

  const toneClasses = {
    green: "border-green-500/30 bg-green-500/10 text-green-300",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
    yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  };

  return (
  <section className="atlas-card rounded-2xl p-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t("subtitle")}
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {alerts.map((alert, index) => (
            <div
              key={`${alert.coin}-${index}`}
              className={`rounded-xl border p-4 ${toneClasses[alert.tone]}`}
            >
              <p className="font-bold">{alert.coin}</p>
              <p className="mt-1 text-sm">{t(alert.key, alert.values)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}