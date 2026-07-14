import Link from "next/link";
import AtlasAnalysis from "../../../components/AtlasAnalysis";
import AtlasScoreCard from "../../../components/AtlasScoreCard";
import CandlestickChart from "../../../components/CandlestickChart";
import EMACard from "../../../components/EMACard";
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

  const signalColor =
    analysis.signal === "LONG"
      ? "text-green-400"
      : analysis.signal === "SHORT"
        ? "text-red-400"
        : "text-yellow-400";

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
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl p-8">
        <Link
          href="/"
          className="text-zinc-400 transition hover:text-white"
        >
          ← Dashboard
        </Link>

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-5xl font-bold">{analysis.coin}</h1>
            <p className="mt-2 text-zinc-400">
              Live market analysis
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm text-zinc-500">Signal</p>
            <p className={`text-4xl font-bold ${signalColor}`}>
              {analysis.signal}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">Price</p>
            <p className="mt-4 text-5xl font-bold">
              ${analysis.price.toFixed(2)}
            </p>
          </div>

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
            score={analysis.confidence}
            signal={analysis.signal}
            trend={trendScore}
            momentum={momentumScore}
            volume={volumeScore}
            risk={riskScore}
          />
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
          <AtlasAnalysis
            signal={analysis.signal}
            score={analysis.confidence}
            change={analysis.change24h.toFixed(2)}
            reasons={analysis.reasons}
          />
        </div>
      </div>
    </main>
  );
}