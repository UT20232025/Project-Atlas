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
  reasons: string[];
};

export async function getAtlasAnalysis(
  symbol: string
): Promise<AtlasAnalysisResult> {
  const [ticker, indicators] = await Promise.all([
    getTicker(symbol),
    getTechnicalIndicators(symbol),
  ]);

  let confidence = ticker.score;
  const reasons = [...ticker.reason];

  if (indicators.trend === "BULLISH") {
    confidence += 8;
    reasons.push("EMA 20 ligger over EMA 50");
  }

  if (indicators.trend === "BEARISH") {
    confidence += 8;
    reasons.push("EMA 20 ligger under EMA 50");
  }

  if (indicators.rsi >= 45 && indicators.rsi <= 65) {
    confidence += 7;
    reasons.push("RSI viser balansert momentum");
  } else if (indicators.rsi > 70) {
    confidence -= 5;
    reasons.push("RSI viser at markedet kan være overkjøpt");
  } else if (indicators.rsi < 30) {
    confidence -= 5;
    reasons.push("RSI viser at markedet kan være oversolgt");
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
    reasons,
  };
}