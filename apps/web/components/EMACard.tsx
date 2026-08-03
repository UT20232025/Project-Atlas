import { getTranslations } from "next-intl/server";

type EMACardProps = {
  ema20: number;
  ema50: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
};

export default async function EMACard({
  ema20,
  ema50,
  trend,
}: EMACardProps) {
  const t = await getTranslations("EMACard");

  const trendColor =
    trend === "BULLISH"
      ? "text-green-400"
      : trend === "BEARISH"
        ? "text-red-400"
        : "text-yellow-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-zinc-400">{t("title")}</p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">{t("ema20")}</span>
          <span className="font-semibold">
            ${ema20.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-500">{t("ema50")}</span>
          <span className="font-semibold">
            ${ema50.toFixed(2)}
          </span>
        </div>
      </div>

      <p className={`mt-5 text-xl font-bold ${trendColor}`}>
        {trend}
      </p>
    </div>
  );
}