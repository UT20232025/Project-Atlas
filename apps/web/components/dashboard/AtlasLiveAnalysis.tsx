"use client";

import { useEffect, useState } from "react";

import AtlasFactorCard from "@/components/dashboard/AtlasFactorCard";
import AtlasTradeSetup from "@/components/dashboard/AtlasTradeSetup";
import Section from "@/components/ui/Section";
import type {
  AtlasAnalysis,
  AtlasFactorResult,
} from "@/lib/atlas/atlasEngine";

type TradeSetup = {
  direction: string;
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward1: number;
  riskReward2: number;
  quality: string;
  explanation: string;
};

type AtlasApiResponse = {
  symbol: string;
  interval: string;
  analysis: AtlasAnalysis;
  priceLevels: {
    support: number | null;
    resistance: number | null;
  };
  tradeSetup: TradeSetup;
  generatedAt: string;
};

function formatSignal(signal: AtlasAnalysis["signal"]) {
  return signal.replaceAll("_", " ");
}

function formatPrice(price: number | null) {
  if (price === null) {
    return "Not detected";
  }

  return price.toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
}

function getSignalLabel(signal: AtlasAnalysis["signal"]) {
  switch (signal) {
    case "STRONG_LONG":
      return "Strong bullish setup";

    case "LONG":
      return "Bullish setup";

    case "SHORT":
      return "Bearish setup";

    case "STRONG_SHORT":
      return "Strong bearish setup";

    default:
      return "No clear trading advantage";
  }
}

function getSignalDescription(analysis: AtlasAnalysis) {
  const bullishFactors = analysis.factors.filter(
    (factor) => factor.status === "BULLISH"
  );

  const bearishFactors = analysis.factors.filter(
    (factor) => factor.status === "BEARISH"
  );

  if (
    analysis.signal === "STRONG_LONG" ||
    analysis.signal === "LONG"
  ) {
    if (bullishFactors.length >= 4) {
      return "Most Atlas indicators are aligned to the upside. Buyers currently have the stronger market advantage.";
    }

    return "Market conditions lean bullish, although some indicators still need stronger confirmation.";
  }

  if (
    analysis.signal === "STRONG_SHORT" ||
    analysis.signal === "SHORT"
  ) {
    if (bearishFactors.length >= 4) {
      return "Most Atlas indicators are aligned to the downside. Sellers currently have the stronger market advantage.";
    }

    return "Market conditions lean bearish, although some indicators still need stronger confirmation.";
  }

  return "Atlas detects conflicting or balanced indicators. Waiting for stronger confirmation may provide a better setup.";
}

function getPriorityFactors(factors: AtlasFactorResult[]) {
  return [...factors]
    .sort((firstFactor, secondFactor) => {
      const firstStrength = Math.abs(
        firstFactor.score / firstFactor.maxScore - 0.5
      );

      const secondStrength = Math.abs(
        secondFactor.score / secondFactor.maxScore - 0.5
      );

      return secondStrength - firstStrength;
    })
    .slice(0, 3);
}

function getStatusTextColor(
  status: AtlasFactorResult["status"]
) {
  if (status === "BULLISH") {
    return "text-emerald-400";
  }

  if (status === "BEARISH") {
    return "text-red-400";
  }

  return "text-amber-300";
}

function getSignalTextColor(
  signal: AtlasAnalysis["signal"]
) {
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

function getRiskTextColor(risk: AtlasAnalysis["risk"]) {
  if (risk === "LOW") {
    return "text-emerald-400";
  }

  if (risk === "HIGH") {
    return "text-red-400";
  }

  return "text-amber-300";
}

export default function AtlasLiveAnalysis() {
  const [data, setData] =
    useState<AtlasApiResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/atlas?symbol=BTCUSDT&interval=1h",
          {
            cache: "no-store",
          }
        );

        const result = (await response.json()) as
          | AtlasApiResponse
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Failed to load Atlas analysis."
          );
        }

        if (!cancelled) {
          setData(result as AtlasApiResponse);
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

    const intervalId = window.setInterval(() => {
      void loadAnalysis();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const priorityFactors = data
    ? getPriorityFactors(data.analysis.factors)
    : [];

  return (
    <Section
      title="Atlas Intelligence"
      subtitle="Live BTC market analysis on the 1-hour timeframe"
    >
      {loading && !data ? (
        <div className="rounded-xl border border-zinc-800 p-8 text-center text-sm text-zinc-500">
          Atlas is analyzing the market...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Signal
              </p>

              <p
                className={`mt-2 text-lg font-semibold ${getSignalTextColor(
                  data.analysis.signal
                )}`}
              >
                {formatSignal(data.analysis.signal)}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Score
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {data.analysis.score}/100
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Confidence
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {data.analysis.confidence}%
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Risk
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
              Atlas Market Brief
            </p>

            <h3 className="mt-3 text-xl font-semibold text-white">
              {getSignalLabel(data.analysis.signal)}
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
              {getSignalDescription(data.analysis)}
            </p>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              {data.analysis.summary}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                Support & Resistance
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                The nearest technical price levels detected
                from recent swing highs and swing lows.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Nearest Support
                </p>

                <p className="mt-2 text-xl font-semibold text-emerald-400">
                  {formatPrice(
                    data.priceLevels.support
                  )}
                </p>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  A nearby level where buyers may attempt to
                  defend the price.
                </p>
              </div>

              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Nearest Resistance
                </p>

                <p className="mt-2 text-xl font-semibold text-red-400">
                  {formatPrice(
                    data.priceLevels.resistance
                  )}
                </p>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  A nearby level where sellers may attempt to
                  reject the price.
                </p>
              </div>
            </div>
          </div>

          <AtlasTradeSetup
            tradeSetup={data.tradeSetup}
          />

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                Key observations
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                The strongest factors currently influencing
                the Atlas signal.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {priorityFactors.map((factor) => (
                <div
                  key={factor.name}
                  className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
                >
                  <div
                    className={`mt-0.5 text-sm font-semibold ${getStatusTextColor(
                      factor.status
                    )}`}
                  >
                    {factor.status === "BULLISH"
                      ? "↑"
                      : factor.status === "BEARISH"
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
                      {factor.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {data.analysis.factors.map((factor) => (
              <AtlasFactorCard
                key={factor.name}
                factor={factor}
              />
            ))}
          </div>

          <p className="text-right text-xs text-zinc-600">
            Updated{" "}
            {new Date(
              data.generatedAt
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>
      ) : null}
    </Section>
  );
}