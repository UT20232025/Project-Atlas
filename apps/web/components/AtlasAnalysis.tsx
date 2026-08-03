import { getTranslations } from "next-intl/server";

type AtlasAnalysisProps = {
  signal: "LONG" | "SHORT" | "WAIT";
  score: number;
  change: string;
  reasons: string[];
};

export default async function AtlasAnalysis({
  signal,
  score,
  change,
  reasons,
}: AtlasAnalysisProps) {
  const t = await getTranslations("AtlasAnalysisLegacy");
  const changeNumber = Number(change);

  const momentum =
    changeNumber > 3
      ? t("momentumStrongBullish")
      : changeNumber < -3
      ? t("momentumStrongBearish")
      : t("momentumNeutral");

  const risk =
    score >= 85
      ? t("riskMedium")
      : score >= 70
      ? t("riskMediumHigh")
      : t("riskWaitLowQuality");

  const conclusion =
    signal === "LONG"
      ? t("conclusionLong")
      : signal === "SHORT"
      ? t("conclusionShort")
      : t("conclusionWait");

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">{t("title")}</h2>
          <p className="mt-1 text-zinc-500">
            {t("subtitleScore", { score })}
          </p>
        </div>

        <div className="rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2">
          <span className="text-sm text-zinc-400">{t("signalLabel")} </span>
          <span className="font-semibold text-white">{signal}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">{t("momentum")}</p>
          <p className="mt-2 font-semibold">{momentum}</p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">{t("risk")}</p>
          <p className="mt-2 font-semibold">{risk}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-zinc-950 p-5">
        <p className="text-sm text-zinc-500">{t("whyThis")}</p>

        <ul className="mt-4 space-y-3">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-3 text-zinc-300">
              <span className="mt-0.5 text-blue-400">●</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-sm text-zinc-500">{t("conclusion")}</p>
        <p className="mt-2 text-zinc-300">{conclusion}</p>
      </div>
    </div>
  );
}
