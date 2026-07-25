"use client";
import AtlasFactorCard from "@/components/dashboard/AtlasFactorCard";
import { useEffect, useState } from "react";

import Section from "@/components/ui/Section";
import type { AtlasAnalysis } from "@/lib/atlas/atlasEngine";

type AtlasApiResponse = {
  symbol: string;
  interval: string;
  analysis: AtlasAnalysis;
  generatedAt: string;
};

function formatSignal(signal: AtlasAnalysis["signal"]) {
  return signal.replaceAll("_", " ");
}

export default function AtlasLiveAnalysis() {
  const [data, setData] = useState<AtlasApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              <p className="mt-2 text-lg font-semibold text-white">
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
              <p className="mt-2 text-lg font-semibold text-white">
                {data.analysis.risk}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="text-sm text-zinc-300">
              {data.analysis.summary}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
  {data.analysis.factors.map((factor) => (
    <AtlasFactorCard key={factor.name} factor={factor} />
  ))}
</div>

          <p className="text-right text-xs text-zinc-600">
            Updated{" "}
            {new Date(data.generatedAt).toLocaleTimeString([], {
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