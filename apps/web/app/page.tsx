import DashboardHero from "../components/dashboard/DashboardHero";
import DashboardBody from "../components/dashboard/DashboardBody";
import TimeframeSelector, {
  resolveTimeframe,
} from "../components/analysis/TimeframeSelector";
import TradingStyleToggle from "../components/TradingStyleToggle";
import { getTradingStyle } from "../lib/preferences/getTradingStyle";
import { STYLE_TIMEFRAME } from "../lib/preferences/tradingStyle";
import LandingPage from "../components/landing/LandingPage";
import CoinSearch from "../components/search/CoinSearch";
import AppLayout from "../components/layout/AppLayout";
import { MarketProvider } from "../components/providers/MarketProvider";
import { ScannerSignalsProvider } from "../components/providers/ScannerSignalsProvider";
import { getAtlasScanner } from "../lib/analysis/scanner";
import { getCachedTrackRecord } from "../lib/atlas/trackRecordCache";
import { getSession } from "../lib/auth/session";
import { getMarketTicker } from "../lib/services/dashboardService";
import {
  getCurrentUser,
  hasActiveSubscription,
} from "../lib/subscription/requirePro";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tf?: string | string[] }>;
}) {
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
  const { tf } = await searchParams;
  const style = await getTradingStyle();
  const timeframe =
    tf != null ? resolveTimeframe(tf) : STYLE_TIMEFRAME[style];

  // Cheap ticker so the shell paints instantly; the scanner-heavy body
  // streams in its own Suspense boundary so the page can never time out on
  // a cold cache.
  const ticker = await getMarketTicker();

  return (
    <MarketProvider>
    <ScannerSignalsProvider interval={timeframe}>
    <AppLayout marketTicker={ticker} userEmail={email} isPro={isPro}>
      <DashboardHero />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <CoinSearch />
        <div className="flex flex-wrap items-center gap-3">
          <TradingStyleToggle active={style} />
          <TimeframeSelector hrefBase="/" active={timeframe} />
        </div>
      </div>

      <DashboardBody
        timeframe={timeframe}
        userId={userId}
        isPro={isPro}
      />
    </AppLayout>
    </ScannerSignalsProvider>
    </MarketProvider>
  );
}