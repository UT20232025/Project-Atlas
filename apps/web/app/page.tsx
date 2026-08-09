import AtlasLiveAnalysis from "@/components/dashboard/AtlasLiveAnalysis";
import AtlasAlerts from "../components/dashboard/AtlasAlerts";
import AtlasIntelligence from "../components/dashboard/AtlasIntelligence";
import DailyBrief from "../components/dashboard/DailyBrief";
import DashboardHero from "../components/dashboard/DashboardHero";
import GettingStarted from "../components/onboarding/GettingStarted";
import MacroEventsCard from "../components/dashboard/MacroEventsCard";
import MarketAlerts from "../components/dashboard/MarketAlerts";
import MarketHeatmap from "../components/dashboard/MarketHeatmap";
import MarketStats from "../components/dashboard/MarketStats";
import OpportunityCard from "../components/dashboard/OpportunityCard";
import RecentSignalChanges from "../components/dashboard/RecentSignalChanges";
import { Suspense } from "react";
import ScannerSection from "../components/dashboard/ScannerSection";
import SwingSignalsSection from "../components/dashboard/SwingSignalsSection";
import WatchlistAlerts from "../components/dashboard/WatchlistAlerts";
import WatchlistSignalBoard from "../components/dashboard/WatchlistSignalBoard";
import LandingPage from "../components/landing/LandingPage";
import CoinSearch from "../components/search/CoinSearch";
import { getAtlasScanner } from "../lib/analysis/scanner";
import AppLayout from "../components/layout/AppLayout";
import { MarketProvider } from "../components/providers/MarketProvider";
import { ScannerSignalsProvider } from "../components/providers/ScannerSignalsProvider";
import Watchlist from "../components/watchlist/Watchlist";
import WatchlistUpsell from "../components/watchlist/WatchlistUpsell";
import { getUpcomingMacroEvents } from "../lib/atlas/macroCalendarEngine";
import { getCachedTrackRecord } from "../lib/atlas/trackRecordCache";
import { getWatchlistAlerts } from "../lib/atlas/signalHistory";
import { getWatchlistSignalBoard } from "../lib/watchlists/signalBoard";
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
    const [trackRecord, scanner] = await Promise.all([
      getCachedTrackRecord(),
      getAtlasScanner(),
    ]);

    // Scanner is pre-sorted by confidence. Show directional calls
    // (LONG/SHORT) first since they're the most compelling, but pad
    // with the highest-confidence remaining analyses so the "explains
    // why" section always renders real reasoning — even in a quiet
    // market where every coin is WAIT.
    const directional = scanner.filter(
      (item) =>
        item.signal === "LONG" || item.signal === "SHORT"
    );
    const others = scanner.filter(
      (item) =>
        item.signal !== "LONG" && item.signal !== "SHORT"
    );
    const topSetups = [...directional, ...others].slice(0, 3);

    return (
      <LandingPage
        trackRecord={trackRecord}
        topSetups={topSetups}
      />
    );
  }

  const user = await getCurrentUser();
  const { id: userId, email } = user;
  const isPro = hasActiveSubscription(user);

  const [dashboard, watchlists, watchlistAlerts, watchlistBoard] =
    await Promise.all([
      getDashboardData(),
      isPro ? getWatchlists(userId) : Promise.resolve([]),
      isPro ? getWatchlistAlerts(userId) : Promise.resolve([]),
      isPro ? getWatchlistSignalBoard(userId) : Promise.resolve([]),
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
    <MarketProvider>
    <ScannerSignalsProvider>
    <AppLayout
      marketTicker={dashboard.marketTicker}
      userEmail={email}
      isPro={isPro}
    >
      <DashboardHero />

      <div className="mb-8">
        <CoinSearch />
      </div>

      {isPro && (
        <div className="mb-8">
          <WatchlistAlerts items={watchlistAlerts} />
        </div>
      )}

      {isPro && watchlistBoard.length > 0 && (
        <div className="mb-8">
          <WatchlistSignalBoard items={watchlistBoard} />
        </div>
      )}

      <div className="mb-8">
        <GettingStarted isPro={isPro} />
      </div>

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

      {isPro && (
        <div className="mb-8">
          <Suspense
            fallback={
              <div className="atlas-card rounded-2xl p-8">
                <div className="h-6 w-56 animate-pulse rounded bg-zinc-800" />
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="h-28 animate-pulse rounded-xl bg-zinc-900" />
                  <div className="h-28 animate-pulse rounded-xl bg-zinc-900" />
                </div>
              </div>
            }
          >
            <SwingSignalsSection />
          </Suspense>
        </div>
      )}

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
            entry={opportunity.entry}
            stopLoss={opportunity.stopLoss}
            takeProfit={opportunity.takeProfit}
            riskRewardRatio={opportunity.riskRewardRatio}
          />
        </div>
      )}

      <div id="markets" className="mb-8">
        <MarketHeatmap items={heatmapItems} />
      </div>

      <div id="alerts" className="mb-8">
        <AtlasAlerts />
      </div>

      <div
        id="watchlist"
        className="mb-8 grid gap-8 xl:grid-cols-[1fr_360px]"
      >
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
    </ScannerSignalsProvider>
    </MarketProvider>
  );
}