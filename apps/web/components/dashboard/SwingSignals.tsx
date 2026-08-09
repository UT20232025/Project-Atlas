import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import TradeLevels from "@/components/dashboard/TradeLevels";
import type { ScannerItem } from "@/lib/analysis/scanner";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";

type SwingSignalsProps = {
  items: ScannerItem[];
};

function signalVariant(
  signal: ScannerItem["signal"]
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

export default async function SwingSignals({
  items,
}: SwingSignalsProps) {
  const t = await getTranslations("SwingSignals");
  const tReasons = await getTranslations("AtlasReasons");
  const locale = await getLocale();

  // Swing = the daily-timeframe read; only directional calls are actionable
  // swing setups, ranked by confidence.
  const directional = items
    .filter((item) => item.signal === "LONG" || item.signal === "SHORT")
    .sort((first, second) => second.confidence - first.confidence)
    .slice(0, 6);

  return (
    <section className="atlas-card rounded-2xl p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-2xl">📅</span>
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
        </div>
      </div>

      {directional.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {directional.map((item) => (
            <Link
              key={item.coin}
              href={`/coin/${item.coin}?tf=1d`}
              className="atlas-subcard flex flex-col gap-3 rounded-xl p-4 transition hover:border-blue-500"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">
                  {item.coin.replace(/USDT$/, "")}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={signalVariant(item.signal)}>
                    {item.signal}
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {item.confidence}%
                  </span>
                </div>
              </div>

              <TradeLevels
                compact
                signal={item.signal}
                entry={item.entry}
                stopLoss={item.stopLoss}
                takeProfit={item.takeProfit}
                riskRewardRatio={item.riskRewardRatio}
              />

              <p className="line-clamp-2 text-sm text-zinc-400">
                {resolveReasonText(tReasons, locale, item.explanation)}
              </p>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-600">{t("disclaimer")}</p>
    </section>
  );
}
