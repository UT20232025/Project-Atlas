import { MARKET_SYMBOLS } from "../config/markets";
import type { SignalType, TrendType } from "../types/market";
import { getCachedAtlasAnalysis } from "../atlas/atlasAnalysisCache";
import type { BinanceInterval } from "../services/binanceCandleService";
import type { AtlasTrendStatus } from "../atlas/atlasIndicators";
import type { AtlasReasonCode } from "../atlas/reasonCode";
import { fetchLiveMarketData } from "../services/liveMarketService";

export type ScannerChecklist = {
  direction: "LONG" | "SHORT";
  metCount: number;
  total: number;
  ready: boolean;
  // Keys of the conditions still unmet (trend/timeframes/structure/…).
  pending: string[];
};

export type ScannerItem = {
  coin: string;
  price: number;
  change24h: number;
  score: number;
  confidence: number;
  signal: SignalType;
  trend: TrendType;
  rsi: number;
  reasons: AtlasReasonCode[];
  explanation: AtlasReasonCode;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;
  // How close this coin is to a valid setup + what it's still waiting for.
  checklist: ScannerChecklist;
};

function mapTrendStatus(
  status: AtlasTrendStatus
): TrendType {
  if (
    status === "STRONG_BULLISH" ||
    status === "BULLISH"
  ) {
    return "BULLISH";
  }

  if (
    status === "STRONG_BEARISH" ||
    status === "BEARISH"
  ) {
    return "BEARISH";
  }

  return "NEUTRAL";
}

export async function getAtlasScanner(
  interval: BinanceInterval = "1h"
): Promise<ScannerItem[]> {
  const [analyses, marketData] = await Promise.all([
    Promise.all(
      MARKET_SYMBOLS.map((symbol) =>
        getCachedAtlasAnalysis(symbol, interval)
      )
    ),
    fetchLiveMarketData(MARKET_SYMBOLS),
  ]);

  const items = MARKET_SYMBOLS.map((symbol, index) => {
    const analysis = analyses[index];
    const market = marketData.find(
      (item) => item.symbol === symbol
    );

    return {
      coin: symbol,
      price: market?.price ?? 0,
      change24h: market?.change24h ?? 0,
      score: analysis.analysis.score,
      confidence: analysis.decision.confidence,
      signal: analysis.decision.signal,
      trend: mapTrendStatus(
        analysis.indicators.trendStatus
      ),
      rsi: analysis.indicators.rawRsi,
      reasons: analysis.decision.reasons,
      explanation: analysis.decision.explanation,
      entry: analysis.decision.entry,
      stopLoss: analysis.decision.stopLoss,
      takeProfit: analysis.decision.takeProfit,
      riskRewardRatio: analysis.decision.riskRewardRatio,
      checklist: {
        direction: analysis.checklist.direction,
        metCount: analysis.checklist.metCount,
        total: analysis.checklist.total,
        ready: analysis.checklist.ready,
        pending: analysis.checklist.items
          .filter((item) => !item.met)
          .map((item) => item.key),
      },
    };
  });

  return items.sort(
    (first, second) =>
      second.confidence - first.confidence
  );
}
