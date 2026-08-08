import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";
import { formatMarketSymbol } from "@/lib/services/liveMarketService";
import type { WatchlistSignalCard } from "@/lib/watchlists/signalBoard";

type WatchlistSignalBoardProps = {
  items: WatchlistSignalCard[];
};

function signalVariant(
  signal: WatchlistSignalCard["signal"]
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

export default async function WatchlistSignalBoard({
  items,
}: WatchlistSignalBoardProps) {
  // Nothing watched yet — stay quiet; the watchlist card handles onboarding.
  if (items.length === 0) {
    return null;
  }

  const t = await getTranslations("WatchlistSignalBoard");
  const tReasons = await getTranslations("AtlasReasons");
  const locale = await getLocale();

  return (
    <section className="atlas-card rounded-2xl p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-2xl">🧭</span>
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.symbol}
            href={`/coin/${item.symbol}`}
            className="atlas-subcard flex flex-col gap-2 rounded-xl p-4 transition hover:border-blue-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white">
                {formatMarketSymbol(item.symbol)}
              </span>
              <Badge variant={signalVariant(item.signal)}>
                {item.signal}
              </Badge>
            </div>

            <div className="text-xs text-zinc-500">
              {t("confidence")} {item.confidence}% ·{" "}
              {t("score")} {item.score}/100
            </div>

            <p className="line-clamp-2 text-sm text-zinc-400">
              {resolveReasonText(tReasons, locale, item.explanation)}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-zinc-600">{t("disclaimer")}</p>
    </section>
  );
}
