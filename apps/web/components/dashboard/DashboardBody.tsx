import { Suspense } from "react";

import AtlasLiveAnalysis from "@/components/dashboard/AtlasLiveAnalysis";
import AtlasAlerts from "@/components/dashboard/AtlasAlerts";
import AtlasIntelligence from "@/components/dashboard/AtlasIntelligence";
import DailyBrief from "@/components/dashboard/DailyBrief";
import GettingStarted from "@/components/onboarding/GettingStarted";
import MacroEventsCard from "@/components/dashboard/MacroEventsCard";
import MarketAlerts from "@/components/dashboard/MarketAlerts";
import MarketHeatmap from "@/components/dashboard/MarketHeatmap";
import MarketStats from "@/components/dashboard/MarketStats";
import BreakingOutNow from "@/components/dashboard/BreakingOutNow";
import NextTradeCard from "@/components/dashboard/NextTradeCard";
import OpportunityCard from "@/components/dashboard/OpportunityCard";
import PriceAlertsSection from "@/components/dashboard/PriceAlertsSection";
import RecentSignalChanges from "@/components/dashboard/RecentSignalChanges";
import ScannerSection from "@/components/dashboard/ScannerSection";
import SwingSignalsSection from "@/components/dashboard/SwingSignalsSection";
import WatchlistAlerts from "@/components/dashboard/WatchlistAlerts";
import WatchlistBoardSection from "@/components/dashboard/WatchlistBoardSection";
import Watchlist from "@/components/watchlist/Watchlist";
import WatchlistUpsell from "@/components/watchlist/WatchlistUpsell";
import type { BinanceInterval } from "@/lib/services/binanceCandleService";
import { getUpcomingMacroEvents } from "@/lib/atlas/macroCalendarEngine";
import { getWatchlistAlerts } from "@/lib/atlas/signalHistory";
import { getDashboardData } from "@/lib/services/dashboardService";
import { getWatchlists } from "@/lib/watchlists/queries";
import {
  addSymbolToWatchlist,
  createWatchlist,
  deleteWatchlist,
  migrateLegacyFavorites,
  removeSymbolFromWatchlist,
} from "@/app/watchlists/actions";

// The scanner-heavy dashboard body, fetched and rendered inside a Suspense
// boundary so the shell (topbar, hero, search) paints instantly and the page
// can never time out waiting on the 20-coin scan.
export default async function DashboardBody({
  timeframe,
  userId,
  isPro,
}: {
  timeframe: BinanceInterval;
  userId: string;
  isPro: boolean;
}) {
  const [dashboard, watchlists, watchlistAlerts] = await Promise.all([
    getDashboardData(timeframe),
    isPro ? getWatchlists(userId) : Promise.resolve([]),
    isPro ? getWatchlistAlerts(userId) : Promise.resolve([]),
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
    <>
      <Suspense fallback={null}>
        <PriceAlertsSection userId={userId} />
      </Suspense>

      <BreakingOutNow items={dashboard.scanner} />

      <div className="mb-8">
        <NextTradeCard items={dashboard.scanner} />
      </div>

      {isPro && (
        <div className="mb-8">
          <WatchlistAlerts items={watchlistAlerts} />
        </div>
      )}

      {isPro && <WatchlistBoardSection userId={userId} />}

      <div className="mb-8">
        <GettingStarted />
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
            removeSymbolFromWatchlistAction={removeSymbolFromWatchlist}
            migrateLegacyFavoritesAction={migrateLegacyFavorites}
          />
        ) : (
          <WatchlistUpsell />
        )}
      </div>

      <div className="mb-8">
        <RecentSignalChanges items={dashboard.recentSignalChanges} />
      </div>

      <ScannerSection items={dashboard.scanner} />
    </>
  );
}
