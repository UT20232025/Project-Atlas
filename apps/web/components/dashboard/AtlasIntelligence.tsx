import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import Section from "@/components/ui/Section";
import MarketBiasMascot from "@/components/dashboard/MarketBiasMascot";

type IntelligenceItem = {
  coin: string;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  signal: "LONG" | "SHORT" | "WAIT";
  score: number;
  change24h: number;
};

type AtlasIntelligenceProps = {
  items: IntelligenceItem[];
  bullish: number;
  bearish: number;
  neutral: number;
};

function getMarketBias(
  bullish: number,
  bearish: number
): "BULLISH" | "BEARISH" | "NEUTRAL" {
  if (bullish > bearish) return "BULLISH";
  if (bearish > bullish) return "BEARISH";
  return "NEUTRAL";
}

function getBiasVariant(
  bias: "BULLISH" | "BEARISH" | "NEUTRAL"
): "green" | "red" | "yellow" {
  if (bias === "BULLISH") return "green";
  if (bias === "BEARISH") return "red";
  return "yellow";
}

function getConfidence(
  bullish: number,
  bearish: number,
  neutral: number
) {
  const total = bullish + bearish + neutral;

  if (total === 0) return 0;

  const strongestGroup = Math.max(
    bullish,
    bearish,
    neutral
  );

  return Math.round((strongestGroup / total) * 100);
}

function getProgressColor(
  bias: "BULLISH" | "BEARISH" | "NEUTRAL"
): "green" | "red" | "yellow" {
  if (bias === "BULLISH") return "green";
  if (bias === "BEARISH") return "red";
  return "yellow";
}

export default async function AtlasIntelligence({
  items,
  bullish,
  bearish,
  neutral,
}: AtlasIntelligenceProps) {
  const t = await getTranslations("AtlasIntelligence");
  const marketBias = getMarketBias(bullish, bearish);
  const confidence = getConfidence(
    bullish,
    bearish,
    neutral
  );

  const strongestCoin = [...items].sort(
    (first, second) => second.score - first.score
  )[0];

  const weakestCoin = [...items].sort(
    (first, second) => first.score - second.score
  )[0];

  const biggestMover = [...items].sort(
    (first, second) =>
      Math.abs(second.change24h) -
      Math.abs(first.change24h)
  )[0];

  const recommendation =
    marketBias === "BULLISH"
      ? t("recBullish")
      : marketBias === "BEARISH"
      ? t("recBearish")
      : t("recNeutral");

  return (
    <Section
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5">
          <p className="text-sm text-zinc-500">
            {t("marketBias")}
          </p>

          <div className="mt-3">
            <Badge variant={getBiasVariant(marketBias)}>
              {marketBias}
            </Badge>
          </div>

          <MarketBiasMascot bias={marketBias} />


          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                {t("confidence")}
              </span>

              <span className="font-bold text-white">
                {confidence}%
              </span>
            </div>

            <Progress
              value={confidence}
              color={getProgressColor(marketBias)}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-green-400">
                {bullish}
              </p>
              <p className="text-xs text-zinc-500">
                {t("bullish")}
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-red-400">
                {bearish}
              </p>
              <p className="text-xs text-zinc-500">
                {t("bearish")}
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-yellow-400">
                {neutral}
              </p>
              <p className="text-xs text-zinc-500">
                {t("neutral")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <p className="text-sm text-zinc-500">
              {t("strongestCoin")}
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {strongestCoin?.coin ?? "N/A"}
            </p>

            <p className="mt-1 text-sm text-green-400">
              {t("atlasScore", { score: strongestCoin?.score ?? 0 })}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <p className="text-sm text-zinc-500">
              {t("weakestCoin")}
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {weakestCoin?.coin ?? "N/A"}
            </p>

            <p className="mt-1 text-sm text-red-400">
              {t("atlasScore", { score: weakestCoin?.score ?? 0 })}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <p className="text-sm text-zinc-500">
              {t("biggestMove")}
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {biggestMover?.coin ?? "N/A"}
            </p>

            <p
              className={
                (biggestMover?.change24h ?? 0) >= 0
                  ? "mt-1 text-sm text-green-400"
                  : "mt-1 text-sm text-red-400"
              }
            >
              {(biggestMover?.change24h ?? 0) >= 0
                ? "+"
                : ""}
              {(biggestMover?.change24h ?? 0).toFixed(2)}%
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <p className="text-sm text-zinc-500">
              {t("recommendation")}
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {recommendation}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}