import Link from "next/link";
import AtlasAnalysis from "../../../components/AtlasAnalysis";
import TradingViewWidget from "../../../components/TradingViewWidget";
import { getTicker } from "../../../lib/binance";

type Props = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function CoinPage({ params }: Props) {
  const { symbol } = await params;
  const data = await getTicker(symbol);

  const signalColor =
    data.signal === "LONG"
      ? "text-green-400"
      : data.signal === "SHORT"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl p-8">
        <Link href="/" className="text-zinc-400 transition hover:text-white">
          ← Dashboard
        </Link>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold">{data.coin}</h1>
            <p className="mt-2 text-zinc-400">Live market analysis</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-zinc-500">Atlas Score</p>
            <p className="text-6xl font-bold">{data.confidence}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">Price</p>
            <p className="mt-4 text-5xl font-bold">${data.price}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">24h Change</p>
            <p
              className={`mt-4 text-5xl font-bold ${
                Number(data.change) >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {data.change}%
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">Signal</p>
            <p className={`mt-4 text-5xl font-bold ${signalColor}`}>
              {data.signal}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <TradingViewWidget symbol={data.coin} />
        </div>

        <div className="mt-8">
          <AtlasAnalysis
            signal={data.signal}
            score={data.score}
            change={data.change}
          />
        </div>
      </div>
    </main>
  );
}