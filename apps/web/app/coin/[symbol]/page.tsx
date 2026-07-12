import Link from "next/link";
import AtlasAnalysis from "../../../components/AtlasAnalysis";
import AtlasScoreCard from "../../../components/AtlasScoreCard";
import EMACard from "../../../components/EMACard";
import RSICard from "../../../components/RSICard";
import TradingViewWidget from "../../../components/TradingViewWidget";
import {
  getTechnicalIndicators,
  getTicker,
} from "../../../lib/binance";

type Props = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function CoinPage({ params }: Props) {
  const { symbol } = await params;

  const [data, indicators] = await Promise.all([
    getTicker(symbol),
    getTechnicalIndicators(symbol),
  ]);

  const signalColor =
    data.signal === "LONG"
      ? "text-green-400"
      : data.signal === "SHORT"
        ? "text-red-400"
        : "text-yellow-400";

  const changeNumber = Number(data.change);

  const trendScore =
    indicators.trend === "BULLISH"
      ? 85
      : indicators.trend === "BEARISH"
        ? 20
        : 50;

  const momentumScore = Math.round(
    Math.min(100, Math.max(20, indicators.rsi))
  );

  const volumeScore =
    Number(data.volume) > 1_000_000_000
      ? 85
      : 55;

  const riskScore =
    Math.abs(changeNumber) > 6
      ? 80
      : Math.abs(changeNumber) > 3
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
            <h1 className="text-5xl font-bold">{data.coin}</h1>
            <p className="mt-2 text-zinc-400">
              Live market analysis
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm text-zinc-500">Signal</p>
            <p className={`text-4xl font-bold ${signalColor}`}>
              {data.signal}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">Price</p>
            <p className="mt-4 text-5xl font-bold">
              ${data.price}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">24h Change</p>
            <p
              className={`mt-4 text-5xl font-bold ${
                changeNumber >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {data.change}%
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">24h Volume</p>
            <p className="mt-4 text-4xl font-bold">
              ${Number(data.volume).toLocaleString("en-US")}
            </p>
          </div>

          <RSICard value={indicators.rsi} />

          <EMACard
            ema20={indicators.ema20}
            ema50={indicators.ema50}
            trend={indicators.trend}
          />
        </div>

        <div className="mt-8">
          <AtlasScoreCard
            score={data.score}
            signal={data.signal}
            trend={trendScore}
            momentum={momentumScore}
            volume={volumeScore}
            risk={riskScore}
          />
        </div>

        <div className="mt-8">
          <TradingViewWidget symbol={data.coin} />
        </div>

        <div className="mt-8">
          <AtlasAnalysis
            signal={data.signal}
            score={data.score}
            change={data.change}
            reasons={[
              ...data.reason,
              `RSI: ${indicators.rsi.toFixed(1)}`,
              `EMA-trend: ${indicators.trend}`,
            ]}
          />
        </div>
      </div>
    </main>
  );
}