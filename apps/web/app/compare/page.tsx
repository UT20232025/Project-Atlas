import { getLocale, getTranslations } from "next-intl/server";

import AppLayout from "@/components/layout/AppLayout";
import TradeLevels from "@/components/dashboard/TradeLevels";
import Badge from "@/components/ui/Badge";
import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";
import {
  fetchSingleMarket,
  formatMarketSymbol,
  MARKET_SYMBOLS,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";
import {
  getCurrentUser,
  hasActiveSubscription,
} from "@/lib/subscription/requirePro";

type Props = {
  searchParams: Promise<{
    a?: string | string[];
    b?: string | string[];
  }>;
};

function resolveSymbol(
  raw: string | string[] | undefined,
  fallback: MarketSymbol
): MarketSymbol {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.toUpperCase();

  return (MARKET_SYMBOLS as readonly string[]).includes(value ?? "")
    ? (value as MarketSymbol)
    : fallback;
}

function signalVariant(
  signal: "LONG" | "SHORT" | "WAIT"
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

export default async function ComparePage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const isPro = hasActiveSubscription(user);

  const { a, b } = await searchParams;
  const symbolA = resolveSymbol(a, MARKET_SYMBOLS[0]);
  const symbolB = resolveSymbol(b, MARKET_SYMBOLS[1]);

  const t = await getTranslations("Compare");
  const tReasons = await getTranslations("AtlasReasons");
  const locale = await getLocale();

  const [analysisA, analysisB, marketA, marketB] = await Promise.all([
    getCachedAtlasAnalysis(symbolA),
    getCachedAtlasAnalysis(symbolB),
    fetchSingleMarket(symbolA),
    fetchSingleMarket(symbolB),
  ]);

  const columns = [
    { symbol: symbolA, analysis: analysisA, market: marketA },
    { symbol: symbolB, analysis: analysisB, market: marketB },
  ];

  // Atlas's lean: a directional call beats a WAIT; between two directional
  // calls, higher confidence wins, then higher score.
  const decisionA = analysisA.decision;
  const decisionB = analysisB.decision;
  const aDirectional = decisionA.signal !== "WAIT";
  const bDirectional = decisionB.signal !== "WAIT";

  let verdict: string;

  if (!aDirectional && !bDirectional) {
    verdict = t("verdictNeither");
  } else if (aDirectional !== bDirectional) {
    verdict = t("verdictLeans", {
      symbol: formatMarketSymbol(aDirectional ? symbolA : symbolB),
    });
  } else {
    const aWins =
      decisionA.confidence !== decisionB.confidence
        ? decisionA.confidence > decisionB.confidence
        : decisionA.score >= decisionB.score;

    verdict = t("verdictLeans", {
      symbol: formatMarketSymbol(aWins ? symbolA : symbolB),
    });
  }

  return (
    <AppLayout userEmail={user.email} isPro={isPro}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-zinc-500">{t("subtitle")}</p>
      </div>

      <form
        method="get"
        className="atlas-card mb-6 flex flex-wrap items-end gap-3 rounded-2xl p-4"
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          {t("assetA")}
          <select
            name="a"
            defaultValue={symbolA}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
          >
            {MARKET_SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {formatMarketSymbol(symbol)}
              </option>
            ))}
          </select>
        </label>

        <span className="pb-2.5 text-zinc-600">vs</span>

        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          {t("assetB")}
          <select
            name="b"
            defaultValue={symbolB}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
          >
            {MARKET_SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {formatMarketSymbol(symbol)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          {t("compareButton")}
        </button>
      </form>

      <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          {t("verdictLabel")}
        </p>
        <p className="mt-1 text-lg font-semibold text-white">{verdict}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {columns.map(({ symbol, analysis, market }) => {
          const decision = analysis.decision;

          return (
            <section
              key={symbol}
              className="atlas-card flex flex-col gap-4 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {formatMarketSymbol(symbol)}
                  </h2>
                  {market && (
                    <p className="mt-1 text-sm text-zinc-400">
                      $
                      {market.price.toLocaleString(locale, {
                        maximumFractionDigits:
                          market.price < 1 ? 6 : 2,
                      })}{" "}
                      <span
                        className={
                          market.change24h >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {market.change24h >= 0 ? "+" : ""}
                        {market.change24h.toFixed(2)}%
                      </span>
                    </p>
                  )}
                </div>

                <Badge variant={signalVariant(decision.signal)}>
                  {decision.signal}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-zinc-500">
                    {t("confidence")}
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {decision.confidence}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{t("score")}</p>
                  <p className="mt-1 font-semibold text-white">
                    {decision.score}/100
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{t("rsi")}</p>
                  <p className="mt-1 font-semibold text-white">
                    {analysis.indicators.rawRsi.toFixed(1)}
                  </p>
                </div>
              </div>

              <TradeLevels
                signal={decision.signal}
                entry={decision.entry}
                stopLoss={decision.stopLoss}
                takeProfit={decision.takeProfit}
                riskRewardRatio={decision.riskRewardRatio}
              />

              <p className="text-sm leading-6 text-zinc-400">
                {resolveReasonText(tReasons, locale, decision.explanation)}
              </p>
            </section>
          );
        })}
      </div>
    </AppLayout>
  );
}
