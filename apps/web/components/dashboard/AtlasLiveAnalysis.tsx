"use client";
import OrderBlockCard from "@/components/dashboard/OrderBlockCard";
import { useSignalPulse } from "@/components/hooks/useSignalPulse";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import FairValueGapCard from "@/components/dashboard/FairValueGapCard";
import MarketStructureCard from "@/components/dashboard/MarketStructureCard";
import AtlasFactorCard from "@/components/dashboard/AtlasFactorCard";
import AtlasTradeSetup from "@/components/dashboard/AtlasTradeSetup";
import TradeChecklist, {
  type TradeChecklistData,
} from "@/components/dashboard/TradeChecklist";
import TradeManagementPlan from "@/components/dashboard/TradeManagementPlan";
import LiquidityCard from "@/components/dashboard/LiquidityCard";
import PriceActionCard from "@/components/dashboard/PriceActionCard";
import TrendEngineCard from "@/components/dashboard/TrendEngineCard";
import VolumeAnalysisCard from "@/components/dashboard/VolumeAnalysisCard";
import Section from "@/components/ui/Section";
import Select from "@/components/ui/Select";
import {
  formatMarketSymbol,
  MARKET_SYMBOLS,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";
import type {
  AtlasAnalysis,
  AtlasFactorResult,
} from "@/lib/atlas/atlasEngine";
import type { LiquidityResult } from "@/lib/atlas/liquidityEngine";
import type { PriceActionResult } from "@/lib/atlas/priceActionEngine";
import type { TrendEngineResult } from "@/lib/atlas/trendEngine";
import MultiTimeframeCard from "@/components/dashboard/MultiTimeframeCard";
import type { AtlasMtfResult } from "@/lib/atlas/multiTimeframeEngine";
import type { VolumeAnalysisResult } from "@/lib/atlas/volumeEngine";
import type { MarketStructureResult } from "@/lib/atlas/marketStructureEngine";
import type { OrderBlockResult } from "@/lib/atlas/orderBlockEngine";
import type { FairValueGapResult } from "@/lib/atlas/fairValueGapEngine";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";

type StopLossOption = {
  price: number;
  type: "STRUCTURE" | "ATR";
  distance: "TIGHT" | "WIDE" | null;
  isPrimary: boolean;
  riskReward1: number | null;
  riskReward2: number | null;
  riskReward3: number | null;
};

type TradeSetup = {
  direction: "LONG" | "SHORT" | "WAIT";
  entry: number | null;
  stopLoss: number | null;
  stops: StopLossOption[];
  takeProfit1: number | null;
  takeProfit2: number | null;
  takeProfit3: number | null;
  riskReward1: number | null;
  riskReward2: number | null;
  riskReward3: number | null;
  quality: "A" | "B" | "C" | "NO_TRADE";
  explanation: AtlasReasonCode[];
};

type AtlasDecision = {
  signal: "LONG" | "SHORT" | "WAIT";
  tradeApproved: boolean;
  strength: string;
  confidence: number;
  score: number;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;
  bullishScore: number;
  bearishScore: number;
  reasons: AtlasReasonCode[];
  warnings: AtlasReasonCode[];
  explanation: AtlasReasonCode;
};

type AtlasApiResponse = {
  symbol: string;
  interval: string;

  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;

  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;

  analysis: AtlasAnalysis;

priceLevels: {
  support: number | null;
  resistance: number | null;
};

trend: TrendEngineResult;
priceAction: PriceActionResult;
liquidity: LiquidityResult;
volume: VolumeAnalysisResult;
marketStructure: MarketStructureResult;
orderBlocks: OrderBlockResult;
fairValueGaps: FairValueGapResult;
multiTimeframe: AtlasMtfResult;
  decision: AtlasDecision;
  tradeSetup: TradeSetup;
  checklist: TradeChecklistData;
  generatedAt: string;
};

type Translator = ReturnType<typeof useTranslations>;

function formatSignal(
  signal: AtlasAnalysis["signal"]
): string {
  return signal.replaceAll("_", " ");
}

function formatDecisionStrength(
  t: Translator,
  strength: string
): string {
  switch (strength) {
    case "STRONG":
      return t("strengthStrong");
    case "MODERATE":
      return t("strengthModerate");
    case "WEAK":
      return t("strengthWeak");
    case "NONE":
      return t("strengthNone");
    default:
      return strength.replaceAll("_", " ");
  }
}

function formatPrice(
  t: Translator,
  price: number | null,
  locale: string
): string {
  if (price === null) {
    return t("notAvailable");
  }

  return price.toLocaleString(locale, {
    maximumFractionDigits: 5,
  });
}

function formatRiskReward(
  t: Translator,
  riskRewardRatio: number | null
): string {
  if (riskRewardRatio === null) {
    return t("notAvailable");
  }

  return `${riskRewardRatio.toFixed(2)} : 1`;
}

function getSignalLabel(
  t: Translator,
  signal: AtlasAnalysis["signal"]
): string {
  switch (signal) {
    case "STRONG_LONG":
      return t("signalLabelStrongLong");

    case "LONG":
      return t("signalLabelLong");

    case "SHORT":
      return t("signalLabelShort");

    case "STRONG_SHORT":
      return t("signalLabelStrongShort");

    default:
      return t("signalLabelWait");
  }
}

function getSignalDescription(
  t: Translator,
  analysis: AtlasAnalysis
): string {
  const bullishFactors =
    analysis.factors.filter(
      (factor) =>
        factor.status === "BULLISH"
    );

  const bearishFactors =
    analysis.factors.filter(
      (factor) =>
        factor.status === "BEARISH"
    );

  if (
    analysis.signal === "STRONG_LONG" ||
    analysis.signal === "LONG"
  ) {
    if (bullishFactors.length >= 4) {
      return t("signalDescriptionBullishStrong");
    }

    return t("signalDescriptionBullishWeak");
  }

  if (
    analysis.signal === "STRONG_SHORT" ||
    analysis.signal === "SHORT"
  ) {
    if (bearishFactors.length >= 4) {
      return t("signalDescriptionBearishStrong");
    }

    return t("signalDescriptionBearishWeak");
  }

  return t("signalDescriptionNeutral");
}

function getPriorityFactors(
  factors: AtlasFactorResult[]
): AtlasFactorResult[] {
  return [...factors]
    .sort(
      (
        firstFactor,
        secondFactor
      ) => {
        const firstStrength =
          Math.abs(
            firstFactor.score /
              firstFactor.maxScore -
              0.5
          );

        const secondStrength =
          Math.abs(
            secondFactor.score /
              secondFactor.maxScore -
              0.5
          );

        return (
          secondStrength -
          firstStrength
        );
      }
    )
    .slice(0, 3);
}

function getStatusTextColor(
  status: AtlasFactorResult["status"]
): string {
  if (status === "BULLISH") {
    return "text-emerald-400";
  }

  if (status === "BEARISH") {
    return "text-red-400";
  }

  return "text-amber-300";
}

function getLegacySignalTextColor(
  signal: AtlasAnalysis["signal"]
): string {
  if (
    signal === "STRONG_LONG" ||
    signal === "LONG"
  ) {
    return "text-emerald-400";
  }

  if (
    signal === "STRONG_SHORT" ||
    signal === "SHORT"
  ) {
    return "text-red-400";
  }

  return "text-amber-300";
}

function getDecisionTextColor(
  signal: AtlasDecision["signal"]
): string {
  if (signal === "LONG") {
    return "text-emerald-400";
  }

  if (signal === "SHORT") {
    return "text-red-400";
  }

  return "text-amber-300";
}

function getDecisionBorderColor(
  signal: AtlasDecision["signal"]
): string {
  if (signal === "LONG") {
    return "border-emerald-500/30";
  }

  if (signal === "SHORT") {
    return "border-red-500/30";
  }

  return "border-amber-500/30";
}

function getDecisionBackground(
  signal: AtlasDecision["signal"]
): string {
  if (signal === "LONG") {
    return "bg-emerald-500/5";
  }

  if (signal === "SHORT") {
    return "bg-red-500/5";
  }

  return "bg-amber-500/5";
}

function getDecisionIcon(
  signal: AtlasDecision["signal"]
): string {
  if (signal === "LONG") {
    return "↑";
  }

  if (signal === "SHORT") {
    return "↓";
  }

  return "—";
}

function getRiskTextColor(
  risk: AtlasAnalysis["risk"]
): string {
  if (risk === "LOW") {
    return "text-emerald-400";
  }

  if (risk === "HIGH") {
    return "text-red-400";
  }

  return "text-amber-300";
}

function useTypewriter(text: string): string {
  const [displayed, setDisplayed] = useState(text);
  const previousText = useRef(text);

  useEffect(() => {
    if (text === previousText.current) {
      return;
    }

    previousText.current = text;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    if (!text || prefersReducedMotion) {
      setDisplayed(text);
      return;
    }

    setDisplayed("");

    let index = 0;
    const intervalId = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(intervalId);
      }
    }, 12);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [text]);

  return displayed;
}

export default function AtlasLiveAnalysis() {
  const t = useTranslations("AtlasLive");
  const tReasons = useTranslations("AtlasReasons");
  const locale = useLocale();

  const [symbol, setSymbol] =
    useState<MarketSymbol>("BTCUSDT");

  const [data, setData] =
    useState<AtlasApiResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/atlas?symbol=${symbol}&interval=1h`,
          {
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as
            | AtlasApiResponse
            | {
                error?: string;
              };

        if (!response.ok) {
          throw new Error(
            "error" in result &&
              result.error
              ? result.error
              : t("loadFailed")
          );
        }

        if (!cancelled) {
          setData(
            result as AtlasApiResponse
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load Atlas analysis."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAnalysis();

    const intervalId =
      window.setInterval(() => {
        void loadAnalysis();
      }, 60_000);

    return () => {
      cancelled = true;

      window.clearInterval(
        intervalId
      );
    };
  }, [symbol]);

  const priorityFactors = data
    ? getPriorityFactors(
        data.analysis.factors
      )
    : [];

  const resolvedExplanation = data
    ? resolveReasonText(
        tReasons,
        locale,
        data.decision.explanation
      )
    : "";

  const typedExplanation = useTypewriter(
    resolvedExplanation
  );

  const signalPulse = useSignalPulse(
    data?.decision.signal
  );

  return (
    <Section
      title={t("title")}
      subtitle={t("subtitle", { symbol: formatMarketSymbol(symbol) })}
      rightContent={
        <Select
          value={symbol}
          onChange={(event) =>
            setSymbol(
              event.target.value as MarketSymbol
            )
          }
          className="w-40"
        >
          {MARKET_SYMBOLS.map((marketSymbol) => (
            <option key={marketSymbol} value={marketSymbol}>
              {formatMarketSymbol(marketSymbol)}
            </option>
          ))}
        </Select>
      }
    >
      {loading && !data ? (
        <div className="rounded-xl border border-zinc-800 p-8 text-center text-sm text-zinc-500">
          {t("loading")}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-5">
          <div
            className={`overflow-hidden rounded-2xl border ${getDecisionBorderColor(
              data.decision.signal
            )} ${getDecisionBackground(
              data.decision.signal
            )}`}
          >
            <div className="border-b border-white/5 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {t("aiDecisionLabel")}
                  </p>

                  <p className="mt-2 text-sm text-zinc-400">
                    {t("aiDecisionDescription")}
                  </p>
                </div>

                <div
                  className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    data.decision
                      .tradeApproved
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900/70 text-zinc-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      data.decision
                        .tradeApproved
                        ? "bg-emerald-400"
                        : "bg-zinc-600"
                    }`}
                  />

                  {data.decision
                    .tradeApproved
                    ? t("tradeApproved")
                    : t("noTrade")}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
                <div>
                  <div className="flex flex-wrap items-end gap-4">
                    <div
                      className={`text-5xl font-bold leading-none ${getDecisionTextColor(
                        data.decision.signal
                      )}`}
                    >
                      {getDecisionIcon(
                        data.decision.signal
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        {t("signalLabel")}
                      </p>

                      <p
                        className={`text-3xl font-bold tracking-tight ${getDecisionTextColor(
                          data.decision.signal
                        )} ${
                          signalPulse
                            ? "atlas-signal-pulse"
                            : ""
                        }`}
                      >
                        {data.decision.signal}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">
                        {t("strengthLabel")}{" "}
                        <span className="font-medium text-zinc-200">
                          {formatDecisionStrength(
                            t,
                            data.decision.strength
                          )}
                        </span>
                      </p>

                      {data.decision.signal === "WAIT" && (
                        <p className="mt-2 text-xs italic text-zinc-500">
                          {t("waitQuip")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className={`mt-6 grid gap-3 ${
                      data.decision.signal === "WAIT"
                        ? "sm:grid-cols-2"
                        : "sm:grid-cols-3"
                    }`}
                  >
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {t("confidence")}
                      </p>

                      <p className="mt-2 text-xl font-semibold text-white">
                        {data.decision.confidence}%
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {t("decisionScore")}
                      </p>

                      <p className="mt-2 text-xl font-semibold text-white">
                        {data.decision.score}
                      </p>
                    </div>

                    {data.decision.signal !== "WAIT" && (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                          {t("riskReward")}
                        </p>

                        <p className="mt-2 text-xl font-semibold text-white">
                          {formatRiskReward(
                            t,
                            data.decision
                              .riskRewardRatio
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {t("bullishScore")}
                      </p>

                      <p className="mt-2 text-lg font-semibold text-emerald-400">
                        {
                          data.decision
                            .bullishScore
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {t("bearishScore")}
                      </p>

                      <p className="mt-2 text-lg font-semibold text-red-400">
                        {
                          data.decision
                            .bearishScore
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {data.decision.signal === "WAIT" ? (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-widest text-amber-300">
                        {t("waitingForTitle")}
                      </p>

                      {data.decision.warnings.length > 0 ? (
                        <>
                          <p className="mt-2 text-sm text-zinc-400">
                            {t("waitingForIntro")}
                          </p>

                          <div className="mt-3 space-y-2">
                            {data.decision.warnings.map(
                              (warning, index) => (
                                <div
                                  key={`${warning.code}-${index}`}
                                  className="flex items-start gap-2 text-sm leading-6 text-zinc-300"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />

                                  <span>
                                    {resolveReasonText(
                                      tReasons,
                                      locale,
                                      warning
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-zinc-400">
                          {t("waitingForFallback")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                          {t("entry")}
                        </p>

                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatPrice(
                            t,
                            data.decision.entry,
                            locale
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                          {t("stopLoss")}
                        </p>

                        <p className="mt-2 text-lg font-semibold text-red-400">
                          {formatPrice(
                            t,
                            data.decision
                              .stopLoss,
                            locale
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                          {t("takeProfit")}
                        </p>

                        <p className="mt-2 text-lg font-semibold text-emerald-400">
                          {formatPrice(
                            t,
                            data.decision
                              .takeProfit,
                            locale
                          )}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                      {t("aiExplanation")}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {typedExplanation}
                      {typedExplanation !==
                        resolvedExplanation && (
                        <span className="atlas-typing-cursor" />
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {(data.decision.reasons
                .length > 0 ||
                (data.decision.signal !== "WAIT" &&
                  data.decision.warnings
                    .length > 0)) && (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {data.decision.reasons
                    .length > 0 && (
                    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                      <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
                        {t("decisionReasons")}
                      </p>

                      <div className="mt-3 space-y-2">
                        {data.decision.reasons.map(
                          (
                            reason,
                            index
                          ) => (
                            <div
                              key={`${reason.code}-${index}`}
                              className="atlas-reveal-item flex items-start gap-2 text-sm leading-6 text-zinc-300"
                              style={{
                                animationDelay: `${index * 90}ms`,
                              }}
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />

                              <span>
                                {resolveReasonText(tReasons, locale, reason)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {data.decision.signal !== "WAIT" &&
                    data.decision.warnings
                      .length > 0 && (
                    <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                      <p className="text-xs font-medium uppercase tracking-widest text-amber-300">
                        {t("riskWarnings")}
                      </p>

                      <div className="mt-3 space-y-2">
                        {data.decision.warnings.map(
                          (
                            warning,
                            index
                          ) => (
                            <div
                              key={`${warning.code}-${index}`}
                              className="atlas-reveal-item flex items-start gap-2 text-sm leading-6 text-zinc-300"
                              style={{
                                animationDelay: `${index * 90}ms`,
                              }}
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />

                              <span>
                                {resolveReasonText(tReasons, locale, warning)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t("indicatorSignal")}
              </p>

              <p
                className={`mt-2 text-lg font-semibold ${getLegacySignalTextColor(
                  data.analysis.signal
                )}`}
              >
                {formatSignal(
                  data.analysis.signal
                )}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t("indicatorScore")}
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {data.analysis.score}/100
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t("indicatorConfidence")}
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {
                  data.analysis
                    .confidence
                }
                %
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t("indicatorRisk")}
              </p>

              <p
                className={`mt-2 text-lg font-semibold ${getRiskTextColor(
                  data.analysis.risk
                )}`}
              >
                {data.analysis.risk}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              {t("marketBrief")}
            </p>

            <h3 className="mt-3 text-xl font-semibold text-white">
              {getSignalLabel(
                t,
                data.analysis.signal
              )}
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
              {getSignalDescription(
                t,
                data.analysis
              )}
            </p>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              {data.analysis.summary
                .map((part) =>
                  resolveReasonText(tReasons, locale, part)
                )
                .join(" ")}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                {t("supportResistance")}
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {t("supportResistanceExplanation")}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {t("nearestSupport")}
                </p>

                <p className="mt-2 text-xl font-semibold text-emerald-400">
                  {formatPrice(
                    t,
                    data.priceLevels
                      .support,
                    locale
                  )}
                </p>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {t("nearestSupportExplanation")}
                </p>
              </div>

              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {t("nearestResistance")}
                </p>

                <p className="mt-2 text-xl font-semibold text-red-400">
                  {formatPrice(
                    t,
                    data.priceLevels
                      .resistance,
                    locale
                  )}
                </p>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {t("nearestResistanceExplanation")}
                </p>
              </div>
            </div>
          </div>

         <AtlasTradeSetup
  tradeSetup={data.tradeSetup}
/>

<TradeChecklist checklist={data.checklist} />

<TradeManagementPlan setup={data.tradeSetup} />

<TrendEngineCard
  trend={data.trend}
/>

<PriceActionCard
  priceAction={data.priceAction}
/>

<LiquidityCard
  liquidity={data.liquidity}
/>

<VolumeAnalysisCard
  volume={data.volume}
/>

<MarketStructureCard
  structure={data.marketStructure}
/>
<OrderBlockCard
  orderBlocks={data.orderBlocks}
/>

<FairValueGapCard
  fairValueGaps={data.fairValueGaps}
/>

<MultiTimeframeCard
  mtf={data.multiTimeframe}
/>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                {t("keyObservations")}
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {t("keyObservationsExplanation")}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {priorityFactors.map(
                (factor) => (
                  <div
                    key={factor.name}
                    className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
                  >
                    <div
                      className={`mt-0.5 text-sm font-semibold ${getStatusTextColor(
                        factor.status
                      )}`}
                    >
                      {factor.status ===
                      "BULLISH"
                        ? "↑"
                        : factor.status ===
                            "BEARISH"
                          ? "↓"
                          : "—"}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-white">
                          {factor.label}
                        </p>

                        <span
                          className={`text-xs font-medium ${getStatusTextColor(
                            factor.status
                          )}`}
                        >
                          {factor.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-zinc-400">
                        {resolveReasonText(
                          tReasons,
                          locale,
                          factor.explanation
                        )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {data.analysis.factors.map(
              (factor) => (
                <AtlasFactorCard
                  key={factor.name}
                  factor={factor}
                />
              )
            )}
          </div>

          <p className="text-right text-xs text-zinc-600">
            {t("updated", {
              time: new Date(
                data.generatedAt
              ).toLocaleTimeString(
                locale,
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              ),
            })}
          </p>
        </div>
      ) : null}
    </Section>
  );
}