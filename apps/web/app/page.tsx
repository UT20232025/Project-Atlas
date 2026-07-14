import DailyBrief from "../components/dashboard/DailyBrief";
import DashboardHero from "../components/dashboard/DashboardHero";
import MarketAlerts from "../components/dashboard/MarketAlerts";
import MarketStats from "../components/dashboard/MarketStats";
import ScannerSection from "../components/dashboard/ScannerSection";
import { getAtlasScanner } from "../lib/analysis/scanner";

async function getFearGreed() {
  const response = await fetch("https://api.alternative.me/fng/", {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("Kunne ikke hente Fear & Greed");
  }

  const data = await response.json();
  const item = data.data[0];

  return {
    value: Number(item.value),
    label: String(item.value_classification),
  };
}

async function getBTCDominance() {
  const response = await fetch("https://api.coingecko.com/api/v3/global", {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("Kunne ikke hente BTC Dominance");
  }

  const data = await response.json();

  return Number(data.data.market_cap_percentage.btc);
}

export default async function HomePage() {
  const [scanner, fearGreed, btcDominance] = await Promise.all([
    getAtlasScanner(),
    getFearGreed(),
    getBTCDominance(),
  ]);

  const bullish = scanner.filter(
    (item) => item.trend === "BULLISH"
  ).length;

  const bearish = scanner.filter(
    (item) => item.trend === "BEARISH"
  ).length;

  const neutral = scanner.filter(
    (item) => item.trend === "NEUTRAL"
  ).length;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <DashboardHero />

        <MarketStats
          scanner={scanner}
          fearGreed={fearGreed}
          btcDominance={btcDominance}
        />

        <div className="mb-8">
          <DailyBrief
            bullish={bullish}
            bearish={bearish}
            neutral={neutral}
            fearGreed={fearGreed.value}
            btcDominance={btcDominance}
          />
        </div>

        <div className="mb-8">
          <MarketAlerts items={scanner} />
        </div>

        <ScannerSection items={scanner} />
      </div>
    </main>
  );
}