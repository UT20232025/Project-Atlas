import { getTranslations } from "next-intl/server";

type DailyBriefProps = {
  bullish: number;
  bearish: number;
  neutral: number;
  fearGreed: number;
  btcDominance: number;
};

export default async function DailyBrief({
  bullish,
  bearish,
  neutral,
  fearGreed,
  btcDominance,
}: DailyBriefProps) {
  const t = await getTranslations("DailyBrief");

  const marketText =
    bullish > bearish
      ? t("marketBullish")
      : bearish > bullish
      ? t("marketBearish")
      : t("marketBalanced");

  const sentiment =
    fearGreed >= 70
      ? t("sentimentGreed")
      : fearGreed <= 30
      ? t("sentimentFear")
      : t("sentimentNeutral");

  return (
   <section className="atlas-card rounded-2xl p-8">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">🤖</span>

        <h2 className="text-2xl font-bold">
          {t("title")}
        </h2>
      </div>

      <div className="space-y-3 text-zinc-300 leading-7">
        <p>{marketText}</p>

        <p>{sentiment}</p>

        <p>
          {t("counts", { bullish, neutral, bearish })}
        </p>

        <p>
          {t("dominance", { value: btcDominance.toFixed(2) })}
        </p>

        <p className="text-green-400 font-semibold">
          {t("recommendation")}
        </p>
      </div>
    </section>
  );
}