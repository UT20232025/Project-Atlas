import Link from "next/link";
import AtlasAnalysis from "../../../components/AtlasAnalysis";
import AtlasScoreCard from "../../../components/AtlasScoreCard";
import AtlasExplain from "../../../components/analysis/AtlasExplain";
import AtlasScoreBreakdownCard from "../../../components/analysis/AtlasScoreBreakdown";
import CandlestickChart from "../../../components/CandlestickChart";
import CoinHero from "../../../components/CoinHero";
import EMACard from "../../../components/EMACard";
import AppLayout from "../../../components/layout/AppLayout";
import MACDChart from "../../../components/MACDChart";
import RSICard from "../../../components/RSICard";
import RSIChart from "../../../components/RSIChart";
import { getAtlasAnalysis } from "../../../lib/analysis/atlasEngine";
import { getChartCandles } from "../../../lib/analysis/candles";
import { getMACDHistory } from "../../../lib/analysis/macdHistory";
import { getRSIHistory } from "../../../lib/analysis/rsiHistory";

type Props = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function CoinPage({ params }: Props) {
  const { symbol } = await params;

  const [analysis, candles, rsiHistory, macdHistory] = await Promise.all([
    getAtlasAnalysis(symbol),
    getChartCandles(symbol),
    getRSIHistory(symbol),
    getMACDHistory(symbol),
  ]);

  const trendScore =
    analysis.trend === "BULLISH"
      ? 85
      : analysis.trend === "BEARISH"
        ? 20
        : 50;

  const momentumScore = Math.round(
    Math.min(100, Math.max(20, analysis.rsi))
  );

  const volumeScore =
    analysis.volume24h > 1_000_000_000 ? 85 : 55;

  const riskScore =
    Math.abs(analysis.change24h) > 6
      ? 80
      : Math.abs(analysis.change24h) > 3
        ? 60
        : 40;

  return (
    <AppLayout>
      <Link
        href="/"
        className="text-zinc-400 transition hover:text-white"
      >
        ← Dashboard
      </Link>

      <div className="mt-8">
        <CoinHero
          coin={analysis.coin}
          price={analysis.price}
          signal={analysis.signal}
          score={analysis.score}
          confidence={analysis.confidence}
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">24h Change</p>

          <p
            className={`mt-4 text-5xl font-bold ${
              analysis.change24h >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {analysis.change24h.toFixed(2)}%
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">24h Volume</p>

          <p className="mt-4 text-4xl font-bold">
            ${analysis.volume24h.toLocaleString("en-US")}
          </p>
        </div>

        <RSICard value={analysis.rsi} />

        <EMACard
          ema20={analysis.ema20}
          ema50={analysis.ema50}
          trend={analysis.trend}
        />
      </div>

      <div className="mt-8">
        <AtlasScoreCard
          score={analysis.score}
          signal={analysis.signal}
          trend={trendScore}
          momentum={momentumScore}
          volume={volumeScore}
          risk={riskScore}
        />
      </div>

      <div className="mt-8">
        <AtlasScoreBreakdownCard score={analysis.breakdown} />
      </div>

      <div className="mt-8">
        <CandlestickChart candles={candles} />
      </div>

      <div className="mt-8">
        <RSIChart values={rsiHistory} />
      </div>

      <div className="mt-8">
        <MACDChart values={macdHistory} />
      </div>

      <div className="mt-8">
        <AtlasExplain
          signal={analysis.signal}
          confidence={analysis.confidence}
          reasons={analysis.reasons}
        />
      </div>

      <div className="mt-8">
        <AtlasAnalysis
          signal={analysis.signal}
          score={analysis.score}
          change={analysis.change24h.toFixed(2)}
          reasons={analysis.reasons}
        />
      </div>
    </AppLayout>
  );
}