import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import type { SignalSnapshotView } from "@/lib/atlas/signalHistory";
import { formatMarketSymbol } from "@/lib/services/liveMarketService";

type WatchlistAlertsProps = {
  items: SignalSnapshotView[];
};

function signalVariant(
  signal: SignalSnapshotView["signal"]
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

function relativeTime(iso: string, locale: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  });

  const minutes = Math.round(diffMs / 60000);

  if (minutes < 60) {
    return rtf.format(-minutes, "minute");
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return rtf.format(-hours, "hour");
  }

  return rtf.format(-Math.round(hours / 24), "day");
}

export default async function WatchlistAlerts({
  items,
}: WatchlistAlertsProps) {
  const t = await getTranslations("WatchlistAlerts");
  const locale = await getLocale();

  return (
    <section className="atlas-card rounded-2xl p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-2xl">🔔</span>
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {items.length > 0
              ? t("count", { count: items.length })
              : t("subtitle")}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
          {t("empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((alert) => (
            <li key={alert.id}>
              <Link
                href={`/coin/${alert.symbol}`}
                className="atlas-subcard flex items-center justify-between rounded-xl p-4 transition hover:border-blue-500"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">
                    {formatMarketSymbol(alert.symbol)}
                  </span>
                  <Badge variant={signalVariant(alert.signal)}>
                    {alert.signal}
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {alert.confidence}%
                  </span>
                </div>

                <span className="text-xs text-zinc-500">
                  {relativeTime(alert.createdAt, locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
