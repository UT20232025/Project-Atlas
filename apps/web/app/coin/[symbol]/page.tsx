import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import AtlasScoreCard from "../../../components/AtlasScoreCard";
import AtlasExplain from "../../../components/analysis/AtlasExplain";
import KeyLevelsCard from "../../../components/analysis/KeyLevelsCard";
import PositionSizeCalculator from "../../../components/analysis/PositionSizeCalculator";
import AtlasScoreBreakdownCard from "../../../components/analysis/AtlasScoreBreakdown";
import SignalHistoryCard from "../../../components/analysis/SignalHistoryCard";
import CandlestickChart from "../../../components/CandlestickChart";
import CoinHero from "../../../components/CoinHero";
import Disclaimer from "../../../components/ui/Disclaimer";
import EMACard from "../../../components/EMACard";
import AppLayout from "../../../components/layout/AppLayout";
import WatchlistButton from "../../../components/watchlist/WatchlistButton";
import MACDChart from "../../../components/MACDChart";
import RSICard from "../../../components/RSICard";
import RSIChart from "../../../components/RSIChart";
import WhaleActivityCard from "../../../components/WhaleActivityCard";
import { getChartCandles } from "../../../lib/analysis/candles";
import { getMACDHistory } from "../../../lib/analysis/macdHistory";
import { getRSIHistory } from "../../../lib/analysis/rsiHistory";
import { getCachedAtlasAnalysis as getAtlasDecision } from "../../../lib/atlas/atlasAnalysisCache";
import { getSignalHistory } from "../../../lib/atlas/signalHistory";
import { analyzeWhaleActivity } from "../../../lib/atlas/whaleEngine";
import { fetchRecentTrades } from "../../../lib/services/binanceTradeService";
import {
  fetchLiveMarketData,
  type MarketSymbol,
} from "../../../lib/services/liveMarketService";
import { getCurrentUser, hasActiveSubscription } from "../../../lib/subscription/requirePro";
import { getWatchlists } from "../../../lib/watchlists/queries";
import {
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
} from "../../watchlists/actions";

type Props = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function CoinPage({ params }: Props) {
  const { symbol } = await params;
  const t = await getTranslations("CoinPage");
  const locale = await getLocale();
  const user = await getCurrentUser();
  const { id: userId, email } = user;
  const isPro = hasActiveSubscription(user);

  const marketSymbol =
    symbol.toUpperCase() as MarketSymbol;

  const [
    marketData,
    candles,
    rsiHistory,
    macdHistory,
    decisionAnalysis,
    signalHistory,
    watchlists,
    recentTrades,
  ] = await Promise.all([
    fetchLiveMarketData([marketSymbol]),
    getChartCandles(symbol),
    getRSIHistory(symbol),
    getMACDHistory(symbol),
    getAtlasDecision(marketSymbol),
    getSignalHistory(marketSymbol, 20),
    isPro ? getWatchlists(userId) : Promise.resolve([]),
    fetchRecentTrades(marketSymbol),
  ]);

  const whaleActivity = analyzeWhaleActivity(recentTrades);

  // Single source of truth: the unified lib/atlas engine (same one the
  // dashboard, scanner, and Telegram use) drives the signal/score, so the
  // headline can no longer contradict the explanation below it.
  const market = marketData[0];
  const decision = decisionAnalysis.decision;
  const indicators = decisionAnalysis.indicators;

  const coin = marketSymbol.replace(/USDT$/, "");

  const emaTrend =
    decisionAnalysis.trend.direction === "BULLISH"
      ? "BULLISH"
      : decisionAnalysis.trend.direction === "BEARISH"
        ? "BEARISH"
        : "NEUTRAL";

  const momentumScore = Math.round(
    Math.min(100, Math.max(20, indicators.rawRsi))
  );

  const chartLevels = [
    decisionAnalysis.priceLevels.resistance !== null && {
      price: decisionAnalysis.priceLevels.resistance,
      color: "#ef4444",
      title: "Resistance",
    },
    decisionAnalysis.priceLevels.support !== null && {
      price: decisionAnalysis.priceLevels.support,
      color: "#22c55e",
      title: "Support",
    },
    decisionAnalysis.volumeProfile.poc !== null && {
      price: decisionAnalysis.volumeProfile.poc,
      color: "#3b82f6",
      title: "POC",
    },
    decisionAnalysis.vwap.vwap !== null && {
      price: decisionAnalysis.vwap.vwap,
      color: "#38bdf8",
      title: "VWAP",
    },
    decisionAnalysis.orderBlocks.nearestBullishOrderBlock && {
      price:
        decisionAnalysis.orderBlocks
          .nearestBullishOrderBlock.midpoint,
      color: "#22c55e",
      title: "OB↑",
    },
    decisionAnalysis.orderBlocks.nearestBearishOrderBlock && {
      price:
        decisionAnalysis.orderBlocks
          .nearestBearishOrderBlock.midpoint,
      color: "#ef4444",
      title: "OB↓",
    },
    decisionAnalysis.fairValueGaps
      .nearestBullishFairValueGap && {
      price:
        decisionAnalysis.fairValueGaps
          .nearestBullishFairValueGap.midpoint,
      color: "#4ade80",
      title: "FVG↑",
    },
    decisionAnalysis.fairValueGaps
      .nearestBearishFairValueGap && {
      price:
        decisionAnalysis.fairValueGaps
          .nearestBearishFairValueGap.midpoint,
      color: "#f87171",
      title: "FVG↓",
    },
    decisionAnalysis.fibonacci.goldenPocketLow !== null && {
      price: decisionAnalysis.fibonacci.goldenPocketLow,
      color: "#f59e0b",
      title: "GP",
    },
    decisionAnalysis.fibonacci.goldenPocketHigh !== null && {
      price: decisionAnalysis.fibonacci.goldenPocketHigh,
      color: "#f59e0b",
      title: "GP",
    },
  ].filter(Boolean) as {
    price: number;
    color: string;
    title: string;
  }[];

  return (
    <AppLayout userEmail={email} isPro={isPro}>
   <div className="flex flex-wrap items-center justify-between gap-4">
  <Link
    href="/"
    className="inline-block py-2 text-zinc-400 transition hover:text-white"
  >
    {t("backToDashboard")}
  </Link>

  {isPro ? (
    <WatchlistButton
      symbol={
        symbol.toUpperCase() as MarketSymbol
      }
      watchlists={watchlists}
      addSymbolToWatchlistAction={addSymbolToWatchlist}
      removeSymbolFromWatchlistAction={
        removeSymbolFromWatchlist
      }
    />
  ) : (
    <Link
      href="/pricing"
      className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-medium text-zinc-300 transition hover:border-yellow-500/40 hover:text-yellow-300"
    >
      {t("upgradeForWatchlists")}
    </Link>
  )}
</div>

      <div className="mt-8">
        <CoinHero
          coin={coin}
          price={market.price}
          signal={decision.signal}
          score={decision.score}
          confidence={decision.confidence}
        />
      </div>

      <div className="mt-6">
        <AtlasExplain
          signal={decision.signal}
          confidence={decision.confidence}
          reasons={decision.reasons}
          warnings={decision.warnings}
          explanation={decision.explanation}
          entry={decision.entry}
          stopLoss={decision.stopLoss}
          takeProfit={decision.takeProfit}
          riskRewardRatio={decision.riskRewardRatio}
        />

        <Disclaimer className="mt-3 px-1" />
      </div>

      {decision.entry !== null &&
        decision.stopLoss !== null && (
          <div className="mt-6">
            <PositionSizeCalculator
              entry={decision.entry}
              stopLoss={decision.stopLoss}
              symbol={coin}
            />
          </div>
        )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">{t("change24h")}</p>

          <p
            className={`mt-4 text-5xl font-bold ${
              market.change24h >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {market.change24h.toFixed(2)}%
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">{t("volume24h")}</p>

          <p className="mt-4 text-4xl font-bold">
            ${market.volume24h.toLocaleString(locale)}
          </p>
        </div>

        <RSICard value={indicators.rawRsi} />

        <EMACard
          ema20={indicators.ema20 ?? 0}
          ema50={indicators.ema50 ?? 0}
          trend={emaTrend}
        />

        <WhaleActivityCard activity={whaleActivity} />
      </div>

      <div className="mt-8">
        <AtlasScoreCard
          score={decision.score}
          signal={decision.signal}
          trend={Math.round(decisionAnalysis.trend.confidence)}
          momentum={momentumScore}
          volume={Math.round(decisionAnalysis.volume.confidence)}
          risk={Math.round(decisionAnalysis.risk.confidence)}
        />
      </div>

      <div className="mt-8">
        <AtlasScoreBreakdownCard
          analysis={decisionAnalysis.analysis}
          bullishScore={decisionAnalysis.decision.bullishScore}
          bearishScore={decisionAnalysis.decision.bearishScore}
        />
      </div>

      <div className="mt-8">
        <KeyLevelsCard
          support={decisionAnalysis.priceLevels.support}
          resistance={decisionAnalysis.priceLevels.resistance}
          poc={decisionAnalysis.volumeProfile.poc}
          vwap={decisionAnalysis.vwap.vwap}
          bullishOrderBlock={
            decisionAnalysis.orderBlocks
              .nearestBullishOrderBlock?.midpoint ?? null
          }
          bearishOrderBlock={
            decisionAnalysis.orderBlocks
              .nearestBearishOrderBlock?.midpoint ?? null
          }
          bullishFvg={
            decisionAnalysis.fairValueGaps
              .nearestBullishFairValueGap?.midpoint ?? null
          }
          bearishFvg={
            decisionAnalysis.fairValueGaps
              .nearestBearishFairValueGap?.midpoint ?? null
          }
          goldenPocketLow={
            decisionAnalysis.fibonacci.goldenPocketLow
          }
          goldenPocketHigh={
            decisionAnalysis.fibonacci.goldenPocketHigh
          }
        />
      </div>

      <div className="mt-8">
        <CandlestickChart
          candles={candles}
          levels={chartLevels}
        />
      </div>

      <div className="mt-8">
        <RSIChart values={rsiHistory} />
      </div>

      <div className="mt-8">
        <MACDChart values={macdHistory} />
      </div>

      <div className="mt-8">
        <SignalHistoryCard history={signalHistory} />
      </div>
    </AppLayout>
  );
}