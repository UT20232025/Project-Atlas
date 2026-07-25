import AtlasIntelligence from "../components/dashboard/AtlasIntelligence";
import DailyBrief from "../components/dashboard/DailyBrief";
import DashboardHero from "../components/dashboard/DashboardHero";
import MarketAlerts from "../components/dashboard/MarketAlerts";
import MarketHeatmap from "../components/dashboard/MarketHeatmap";
import MarketStats from "../components/dashboard/MarketStats";
import OpportunityCard from "../components/dashboard/OpportunityCard";
import ScannerSection from "../components/dashboard/ScannerSection";
import AppLayout from "../components/layout/AppLayout";
import Watchlist from "../components/watchlist/Watchlist";
import { getDashboardData } from "../lib/services/dashboardService";

function createOpportunityReason(
  signal: "LONG" | "SHORT" | "WAIT",
  score: number,
  change24h: number
) {
  if (signal === "LONG") {
    return `Atlas detects bullish momentum with a confidence score of ${score}%. The market is ${
      change24h >= 0 ? "strengthening" : "showing recovery potential"
    }, but risk management should still be used.`;
  }

  if (signal === "SHORT") {
    return `Atlas detects bearish pressure with a confidence score of ${score}%. Momentum currently favors further downside, although market conditions can change quickly.`;
  }

  return `Atlas does not currently see a high-quality entry. The confidence score is ${score}%, so waiting for stronger confirmation may provide a better risk-to-reward setup.`;
}

export default async function HomePage() {
  const dashboard = await getDashboardData();

  const opportunity = [...dashboard.scanner].sort(
    (first, second) => second.score - first.score
  )[0];

  const heatmapItems = dashboard.scanner.map((item) => ({
    coin: item.coin,
    price: item.price,
    change24h: item.change24h,
    score: item.score,
  }));

  return (
    <AppLayout marketTicker={dashboard.marketTicker}>
      <DashboardHero />

      <div className="mb-8">
        <AtlasIntelligence
          items={dashboard.scanner}
          bullish={dashboard.bullish}
          bearish={dashboard.bearish}
          neutral={dashboard.neutral}
        />
      </div>

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

      {opportunity && (
        <div className="mb-8">
          <OpportunityCard
            coin={opportunity.coin}
            signal={opportunity.signal}
            score={opportunity.score}
            price={opportunity.price}
            change24h={opportunity.change24h}
            reason={createOpportunityReason(
              opportunity.signal,
              opportunity.score,
              opportunity.change24h
            )}
          />
        </div>
      )}

      <div className="mb-8">
        <MarketHeatmap items={heatmapItems} />
      </div>

      <div className="mb-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <MarketAlerts items={dashboard.scanner} />
        <Watchlist />
      </div>

      <ScannerSection items={dashboard.scanner} />
    </AppLayout>
  );
}