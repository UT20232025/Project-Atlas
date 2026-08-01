import AtlasLiveAnalysis from "@/components/dashboard/AtlasLiveAnalysis";
import AtlasAlerts from "../components/dashboard/AtlasAlerts";
import AtlasIntelligence from "../components/dashboard/AtlasIntelligence";
import DailyBrief from "../components/dashboard/DailyBrief";
import DashboardHero from "../components/dashboard/DashboardHero";
import MacroEventsCard from "../components/dashboard/MacroEventsCard";
import MarketAlerts from "../components/dashboard/MarketAlerts";
import MarketHeatmap from "../components/dashboard/MarketHeatmap";
import MarketStats from "../components/dashboard/MarketStats";
import OpportunityCard from "../components/dashboard/OpportunityCard";
import RecentSignalChanges from "../components/dashboard/RecentSignalChanges";
import ScannerSection from "../components/dashboard/ScannerSection";
import LandingPage from "../components/landing/LandingPage";
import AppLayout from "../components/layout/AppLayout";
import Watchlist from "../components/watchlist/Watchlist";
import WatchlistUpsell from "../components/watchlist/WatchlistUpsell";
import { getUpcomingMacroEvents } from "../lib/atlas/macroCalendarEngine";
import { getTrackRecord } from "../lib/atlas/trackRecord";
import { getSession } from "../lib/auth/session";
import { getDashboardData } from "../lib/services/dashboardService";
import { getCurrentUser, hasActiveSubscription } from "../lib/subscription/requirePro";
import { getWatchlists } from "../lib/watchlists/queries";
import {
  addSymbolToWatchlist,
  createWatchlist,
  deleteWatchlist,
  migrateLegacyFavorites,
  removeSymbolFromWatchlist,
} from "./watchlists/actions";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    const trackRecord = await getTrackRecord();
    return <LandingPage trackRecord={trackRecord} />;
  }

  const user = await getCurrentUser();
  const { id: userId, email } = user;
  const isPro = hasActiveSubscription(user);

  const [dashboard, watchlists] = await Promise.all([
    getDashboardData(),
    isPro ? getWatchlists(userId) : Promise.resolve([]),
  ]);

  const opportunity = [...dashboard.scanner].sort(
    (first, second) => second.score - first.score
  )[0];

  const upcomingMacroEvents = getUpcomingMacroEvents();

  const heatmapItems = dashboard.scanner.map((item) => ({
    coin: item.coin,
    price: item.price,
    change24h: item.change24h,
    score: item.score,
  }));

  return (
    <AppLayout
      marketTicker={dashboard.marketTicker}
      userEmail={email}
      isPro={isPro}
    >
      <DashboardHero />

      <MacroEventsCard events={upcomingMacroEvents} />

      <div className="mb-8">
        <AtlasLiveAnalysis />
      </div>

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
            reason={opportunity.explanation}
          />
        </div>
      )}

      <div className="mb-8">
        <MarketHeatmap items={heatmapItems} />
      </div>

      <div className="mb-8">
        <AtlasAlerts />
      </div>

      <div className="mb-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <MarketAlerts items={dashboard.scanner} />
        {isPro ? (
          <Watchlist
            watchlists={watchlists}
            createWatchlistAction={createWatchlist}
            deleteWatchlistAction={deleteWatchlist}
            addSymbolToWatchlistAction={addSymbolToWatchlist}
            removeSymbolFromWatchlistAction={
              removeSymbolFromWatchlist
            }
            migrateLegacyFavoritesAction={
              migrateLegacyFavorites
            }
          />
        ) : (
          <WatchlistUpsell />
        )}
      </div>

      <div className="mb-8">
        <RecentSignalChanges
          items={dashboard.recentSignalChanges}
        />
      </div>

      <ScannerSection items={dashboard.scanner} />
    </AppLayout>
  );
}