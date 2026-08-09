import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import Section from "@/components/ui/Section";
import TradeLevels from "@/components/dashboard/TradeLevels";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";

type OpportunityCardProps = {
  coin: string;
  signal: "LONG" | "SHORT" | "WAIT";
  score: number;
  price: number;
  change24h: number;
  reason: AtlasReasonCode;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;
};

function getSignalVariant(
  signal: OpportunityCardProps["signal"]
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

function getProgressColor(
  score: number
): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

export default async function OpportunityCard({
  coin,
  signal,
  score,
  price,
  change24h,
  reason,
  entry,
  stopLoss,
  takeProfit,
  riskRewardRatio,
}: OpportunityCardProps) {
  const t = await getTranslations("OpportunityCard");
  const tReasons = await getTranslations("AtlasReasons");
  const locale = await getLocale();
  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <Section
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-3xl font-bold text-white">
              {coin}
            </h3>

            <p className="mt-1 text-zinc-400">
              $
              {price.toLocaleString(locale, {
                maximumFractionDigits: price < 1 ? 6 : 2,
              })}
            </p>
          </div>

          <Badge variant={getSignalVariant(signal)}>
            {signal}
          </Badge>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              {t("atlasConfidence")}
            </span>

            <span className="font-bold text-white">
              {safeScore}%
            </span>
          </div>

          <Progress
            value={safeScore}
            color={getProgressColor(safeScore)}
          />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-sm leading-6 text-zinc-300">
            {resolveReasonText(tReasons, locale, reason)}
          </p>
        </div>

        <TradeLevels
          signal={signal}
          entry={entry}
          stopLoss={stopLoss}
          takeProfit={takeProfit}
          riskRewardRatio={riskRewardRatio}
        />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-500">
              {t("changeLabel")}
            </p>

            <p
              className={
                change24h >= 0
                  ? "mt-1 font-semibold text-green-400"
                  : "mt-1 font-semibold text-red-400"
              }
            >
              {change24h >= 0 ? "+" : ""}
              {change24h.toFixed(2)}%
            </p>
          </div>

          <Link
            href={`/coin/${coin}`}
            className="inline-flex items-center justify-center rounded-xl border border-blue-500 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            {t("openMarket")}
          </Link>
        </div>
      </div>
    </Section>
  );
}