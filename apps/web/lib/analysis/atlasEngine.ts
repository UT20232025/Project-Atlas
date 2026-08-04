import { getTechnicalIndicators, getTicker } from "../binance";
import type { SignalType, TrendType } from "../types/market";
import {
  calculateAtlasScore,
  type AtlasScoreBreakdown,
} from "./score";

export type AtlasAnalysisResult = {
  coin: string;
  price: number;
  change24h: number;
  volume24h: number;

  rsi: number;
  ema20: number;
  ema50: number;
  trend: TrendType;

  score: number;
  signal: SignalType;
  confidence: number;
  breakdown: AtlasScoreBreakdown;
};

export async function getAtlasAnalysis(
  symbol: string
): Promise<AtlasAnalysisResult> {
  const [ticker, indicators] = await Promise.all([
    getTicker(symbol),
    getTechnicalIndicators(symbol),
  ]);

  let confidence = ticker.score;

  if (indicators.trend === "BULLISH" || indicators.trend === "BEARISH") {
    confidence += 8;
  }

  if (indicators.rsi >= 45 && indicators.rsi <= 65) {
    confidence += 7;
  } else if (indicators.rsi > 70 || indicators.rsi < 30) {
    confidence -= 5;
  }

  confidence = Math.max(0, Math.min(100, confidence));

  const breakdown = calculateAtlasScore({
    trend: indicators.trend,
    rsi: indicators.rsi,
    volume24h: Number(ticker.volume),
    confidence,
  });

  return {
    coin: ticker.coin,
    price: Number(ticker.price),
    change24h: Number(ticker.change),
    volume24h: Number(ticker.volume),

    rsi: indicators.rsi,
    ema20: indicators.ema20,
    ema50: indicators.ema50,
    trend: indicators.trend,

    score: breakdown.total,
    signal: ticker.signal,
    confidence,
    breakdown,
  };
}