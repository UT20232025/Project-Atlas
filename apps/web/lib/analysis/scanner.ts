import { MARKET_SYMBOLS } from "../config/markets";
import type { SignalType, TrendType } from "../types/market";
import { getAtlasAnalysis } from "./atlasEngine";

export type ScannerItem = {
  coin: string;
  price: number;
  change24h: number;
  score: number;
  confidence: number;
  signal: SignalType;
  trend: TrendType;
  rsi: number;
};

export async function getAtlasScanner(): Promise<ScannerItem[]> {
  const analyses = await Promise.all(
    MARKET_SYMBOLS.map((symbol) => getAtlasAnalysis(symbol))
  );

  return analyses
    .map((analysis) => ({
      coin: analysis.coin,
      price: analysis.price,
      change24h: analysis.change24h,
      score: analysis.score,
      confidence: analysis.confidence,
      signal: analysis.signal,
      trend: analysis.trend,
      rsi: analysis.rsi,
    }))
    .sort((a, b) => b.confidence - a.confidence);
}