import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import type { ExchangeHoldingsResult } from "@/lib/exchange/connection";
import { exchangeLabel } from "@/lib/exchange/registry";

function signalVariant(
  signal: "LONG" | "SHORT" | "WAIT"
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

export default async function ExchangeHoldings({
  result,
}: {
  result: ExchangeHoldingsResult;
}) {
  // Not connected — the manual portfolio below handles that case.
  if (!result.connected) {
    return null;
  }

  const t = await getTranslations("Exchange");
  const locale = await getLocale();
  const label = exchangeLabel(result.exchange);

  if ("error" in result) {
    return (
      <section className="atlas-card mb-8 rounded-2xl p-8">
        <h2 className="text-2xl font-bold">
          {t("holdingsTitle", { exchange: label })}
        </h2>
        <p className="mt-3 text-sm text-red-400">{t("holdingsError")}</p>
        <p className="mt-2 text-sm text-zinc-500">
          <Link href="/settings" className="underline">
            {t("manageInSettings")}
          </Link>
        </p>
      </section>
    );
  }

  const { holdings, totalUsd } = result;

  const fmtUsd = (value: number) =>
    value.toLocaleString(locale, { maximumFractionDigits: 2 });
  const fmtAmount = (value: number) =>
    value.toLocaleString(locale, {
      maximumFractionDigits: value >= 1 ? 4 : 8,
    });

  return (
    <section className="atlas-card mb-8 rounded-2xl p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">
            {t("holdingsTitle", { exchange: label })}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {t("holdingsSubtitle")}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-500">{t("totalValue")}</p>
          <p className="text-2xl font-bold text-white">
            ${fmtUsd(totalUsd)}
          </p>
        </div>
      </div>

      {holdings.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("noHoldings")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-zinc-500">
                <th className="pb-3 font-medium">{t("colAsset")}</th>
                <th className="pb-3 font-medium">{t("colAmount")}</th>
                <th className="pb-3 font-medium">{t("colAtlas")}</th>
                <th className="pb-3 text-right font-medium">
                  {t("colValue")}
                </th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr
                  key={holding.asset}
                  className="border-t border-zinc-800"
                >
                  <td className="py-3 font-medium text-white">
                    {holding.asset}
                  </td>
                  <td className="py-3 text-zinc-300">
                    {fmtAmount(holding.amount)}
                  </td>
                  <td className="py-3">
                    {holding.atlasSignal ? (
                      <span className="inline-flex items-center gap-2">
                        <Badge
                          variant={signalVariant(
                            holding.atlasSignal.signal
                          )}
                        >
                          {holding.atlasSignal.signal}
                        </Badge>
                        <span className="text-xs text-zinc-500">
                          {holding.atlasSignal.confidence}%
                        </span>
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right text-zinc-300">
                    {holding.usdValue == null
                      ? "—"
                      : `$${fmtUsd(holding.usdValue)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-600">{t("readOnlyNote")}</p>
    </section>
  );
}
