import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import Section from "@/components/ui/Section";

type HeatmapItem = {
  coin: string;
  price: number;
  change24h: number;
  score: number;
};

type MarketHeatmapProps = {
  items: HeatmapItem[];
};

function getHeatmapStyle(change24h: number) {
  if (change24h >= 5) {
    return "border-green-400/40 bg-green-500/20 hover:bg-green-500/30";
  }

  if (change24h >= 1) {
    return "border-green-500/30 bg-green-500/10 hover:bg-green-500/20";
  }

  if (change24h <= -5) {
    return "border-red-400/40 bg-red-500/20 hover:bg-red-500/30";
  }

  if (change24h <= -1) {
    return "border-red-500/30 bg-red-500/10 hover:bg-red-500/20";
  }

  return "border-zinc-700 bg-zinc-900 hover:bg-zinc-800";
}

function formatPrice(price: number, locale: string) {
  return price.toLocaleString(locale, {
    maximumFractionDigits: price < 1 ? 6 : 2,
  });
}

export default async function MarketHeatmap({
  items,
}: MarketHeatmapProps) {
  const t = await getTranslations("MarketHeatmap");
  const locale = await getLocale();

  return (
    <Section
      title={t("title")}
      subtitle={t("subtitle")}
    >
      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-8 text-center">
          <p className="text-sm text-zinc-500">
            {t("empty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const positive = item.change24h >= 0;

            return (
              <Link
                key={item.coin}
                href={`/coin/${item.coin}`}
                className={`rounded-2xl border p-4 transition ${getHeatmapStyle(
                  item.change24h
                )}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">
                      {item.coin}
                    </p>

                    <p className="mt-1 text-sm text-zinc-400">
                      ${formatPrice(item.price, locale)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={
                        positive
                          ? "font-bold text-green-300"
                          : "font-bold text-red-300"
                      }
                    >
                      {positive ? "+" : ""}
                      {item.change24h.toFixed(2)}%
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {t("atlasScore", { score: item.score })}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Section>
  );
}