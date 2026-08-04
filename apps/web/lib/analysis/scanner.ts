import { MARKET_SYMBOLS } from "../config/markets";
import type { SignalType, TrendType } from "../types/market";
import { getCachedAtlasAnalysis } from "../atlas/atlasAnalysisCache";
import type { AtlasTrendStatus } from "../atlas/atlasIndicators";
import type { AtlasReasonCode } from "../atlas/reasonCode";
import { fetchLiveMarketData } from "../services/liveMarketService";

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

export async function getAtlasScanner(): Promise<ScannerItem[]> {
  const [analyses, marketData] = await Promise.all([
    Promise.all(
      MARKET_SYMBOLS.map((symbol) =>
        getCachedAtlasAnalysis(symbol)
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
    };
  });

  return items.sort(
    (first, second) =>
      second.confidence - first.confidence
  );
}
