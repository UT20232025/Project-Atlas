import BTCDominanceCard from "../components/BTCDominanceCard";
import FearGreedCard from "../components/FearGreedCard";
import Header from "../components/Header";
import MarketOverview from "../components/MarketOverview";
import Sidebar from "../components/Sidebar";
import TopMovers from "../components/TopMovers";
import WatchlistTable from "../components/WatchlistTable";
import { getMarket, getTopMovers } from "../lib/binance";

async function getFearGreed() {
  const res = await fetch("https://api.alternative.me/fng/", {
    next: { revalidate: 3600 },
  });

  const data = await res.json();
  const item = data.data[0];

  return {
    value: Number(item.value),
    label: item.value_classification,
  };
}

async function getBTCDominance() {
  const res = await fetch("https://api.coingecko.com/api/v3/global", {
    next: { revalidate: 3600 },
  });

  const data = await res.json();

  return Number(data.data.market_cap_percentage.btc).toFixed(2);
}

export default async function Home() {
  const signals = await getMarket();
  const topMovers = await getTopMovers();
  const fearGreed = await getFearGreed();
  const btcDominance = await getBTCDominance();

  return (
    <main className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />

      <section className="flex-1 p-8">
        <Header />

        <div className="mb-8 grid gap-4 md:grid-cols-5">
          <div className="md:col-span-3">
            <MarketOverview />
          </div>

          <FearGreedCard value={fearGreed.value} label={fearGreed.label} />

          <BTCDominanceCard value={btcDominance} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <WatchlistTable items={signals} />
          <TopMovers items={topMovers} />
        </div>
      </section>
    </main>
  );
}