import { getTranslations } from "next-intl/server";

type RSICardProps = {
  value: number;
};

export default async function RSICard({ value }: RSICardProps) {
  const t = await getTranslations("RSICard");

  let color = "text-yellow-400";
  let label = t("neutral");

  if (value >= 70) {
    color = "text-red-400";
    label = t("overbought");
  } else if (value <= 30) {
    color = "text-green-400";
    label = t("oversold");
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-zinc-400">{t("title")}</p>

      <p className={`mt-4 text-5xl font-bold ${color}`}>
        {value.toFixed(1)}
      </p>

      <p className={`mt-2 font-semibold ${color}`}>
        {label}
      </p>
    </div>
  );
}