import { getTranslations } from "next-intl/server";

import StatCard from "../StatCard";
import type { ScannerItem } from "../../lib/analysis/scanner";

type MarketStatsProps = {
  scanner: ScannerItem[];
  fearGreed: {
    value: number;
    label: string;
  };
  btcDominance: number;
};

function getMarketHealth(
  t: Awaited<ReturnType<typeof getTranslations>>,
  bullishCount: number,
  bearishCount: number
) {
  if (bullishCount > bearishCount + 3) {
    return {
      value: t("bullish"),
      subtitle: t("marketsUp", { count: bullishCount }),
      color: "green" as const,
    };
  }

  if (bearishCount > bullishCount + 3) {
    return {
      value: t("bearish"),
      subtitle: t("marketsDown", { count: bearishCount }),
      color: "red" as const,
    };
  }

  return {
    value: t("neutral"),
    subtitle: t("mixedMarket"),
    color: "yellow" as const,
  };
}

export default async function MarketStats({
  scanner,
  fearGreed,
  btcDominance,
}: MarketStatsProps) {
  const t = await getTranslations("MarketStats");

  const bullishCount = scanner.filter(
    (item) => item.trend === "BULLISH"
  ).length;

  const bearishCount = scanner.filter(
    (item) => item.trend === "BEARISH"
  ).length;

  const marketHealth = getMarketHealth(
    t,
    bullishCount,
    bearishCount
  );

  const topSetup = scanner[0];

  return (
   <section className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title={t("marketHealth")}
        value={marketHealth.value}
        subtitle={marketHealth.subtitle}
        color={marketHealth.color}
      />

      <StatCard
        title={t("fearGreed")}
        value={String(fearGreed.value)}
        subtitle={fearGreed.label}
        color={
          fearGreed.value >= 70
            ? "green"
            : fearGreed.value <= 30
              ? "red"
              : "yellow"
        }
      />

      <StatCard
        title={t("btcDominance")}
        value={`${btcDominance.toFixed(2)}%`}
        subtitle={t("bitcoinShare")}
        color="blue"
      />

      <StatCard
        title={t("bestSetup")}
        value={topSetup?.coin ?? "-"}
        subtitle={
          topSetup
            ? t("setupConfidence", { signal: topSetup.signal, confidence: topSetup.confidence })
            : t("noData")
        }
        color={
          topSetup?.signal === "LONG"
            ? "green"
            : topSetup?.signal === "SHORT"
              ? "red"
              : "yellow"
        }
      />
    </section>
  );
}