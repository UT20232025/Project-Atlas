import DailyBrief from "../components/dashboard/DailyBrief";
import DashboardHero from "../components/dashboard/DashboardHero";
import MarketAlerts from "../components/dashboard/MarketAlerts";
import MarketStats from "../components/dashboard/MarketStats";
import ScannerSection from "../components/dashboard/ScannerSection";
import AppLayout from "../components/layout/AppLayout";
import Watchlist from "../components/watchlist/Watchlist";
import { getDashboardData } from "../lib/services/dashboardService";

export default async function HomePage() {
  const dashboard = await getDashboardData();

  return (
    <AppLayout marketTicker={dashboard.marketTicker}>
      <DashboardHero />

      <MarketStats
        scanner={dashboard.scanner}
        fearGreed={dashboard.fearGreed}
        btcDominance={dashboard.btcDominance}
      />

      <div className="mb-8">
        <DailyBrief
          bullish={dashboard.bullish}
          bearish={dashboard.bearish}
          neutral={dashboard.neutral}
          fearGreed={dashboard.fearGreed.value}
          btcDominance={dashboard.btcDominance}
        />
      </div>

      <div className="mb-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <MarketAlerts items={dashboard.scanner} />
        <Watchlist />
      </div>

      <ScannerSection items={dashboard.scanner} />
    </AppLayout>
  );
}