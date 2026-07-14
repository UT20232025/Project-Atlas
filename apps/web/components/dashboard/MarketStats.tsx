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
  bullishCount: number,
  bearishCount: number
) {
  if (bullishCount > bearishCount + 3) {
    return {
      value: "Bullish",
      subtitle: `${bullishCount} markeder i opptrend`,
      color: "green" as const,
    };
  }

  if (bearishCount > bullishCount + 3) {
    return {
      value: "Bearish",
      subtitle: `${bearishCount} markeder i nedtrend`,
      color: "red" as const,
    };
  }

  return {
    value: "Neutral",
    subtitle: "Blandet marked",
    color: "yellow" as const,
  };
}

export default function MarketStats({
  scanner,
  fearGreed,
  btcDominance,
}: MarketStatsProps) {
  const bullishCount = scanner.filter(
    (item) => item.trend === "BULLISH"
  ).length;

  const bearishCount = scanner.filter(
    (item) => item.trend === "BEARISH"
  ).length;

  const marketHealth = getMarketHealth(
    bullishCount,
    bearishCount
  );

  const topSetup = scanner[0];

  return (
    <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Market Health"
        value={marketHealth.value}
        subtitle={marketHealth.subtitle}
        color={marketHealth.color}
      />

      <StatCard
        title="Fear & Greed"
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
        title="BTC Dominance"
        value={`${btcDominance.toFixed(2)}%`}
        subtitle="Bitcoin markedsandel"
        color="blue"
      />

      <StatCard
        title="Best Setup"
        value={topSetup?.coin ?? "-"}
        subtitle={
          topSetup
            ? `${topSetup.signal} • Confidence ${topSetup.confidence}`
            : "Ingen data"
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