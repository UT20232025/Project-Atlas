import DailyBrief from "../components/dashboard/DailyBrief";
import DashboardHero from "../components/dashboard/DashboardHero";
import MarketAlerts from "../components/dashboard/MarketAlerts";
import MarketStats from "../components/dashboard/MarketStats";
import ScannerSection from "../components/dashboard/ScannerSection";
import AppLayout from "../components/layout/AppLayout";
import { getDashboardData } from "../lib/services/dashboardService";

export default async function HomePage() {
  const dashboard = await getDashboardData();

  return (
    <AppLayout>
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

      <div className="mb-8">
        <MarketAlerts items={dashboard.scanner} />
      </div>

      <ScannerSection items={dashboard.scanner} />
    </AppLayout>
  );
}