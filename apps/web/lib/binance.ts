import { calculateAtlasSignal } from "./analysis/atlas";
import {
  calculateEMA,
  calculateEMATrend,
} from "./analysis/ema";
import { calculateRSI } from "./analysis/rsi";
import {
  fetchKlineCloses,
  fetchTicker,
  fetchTopMovers,
} from "./api/binance";
import { MARKET_SYMBOLS } from "./config/markets";
import type { TechnicalIndicators } from "./types/market";

export async function getTicker(symbol: string) {
  const ticker = await fetchTicker(symbol);

  const atlas = calculateAtlasSignal({
    priceChangePercent: Number(ticker.change),
    volume: Number(ticker.volume),
  });

  return {
    ...ticker,
    signal: atlas.signal,
    score: atlas.score,
    reason: atlas.reason,
  };
}

export async function getMarket() {
  return Promise.all(
    MARKET_SYMBOLS.map((symbol) => getTicker(symbol))
  );
}

export async function getTopMovers() {
  return fetchTopMovers();
}

export async function getTechnicalIndicators(
  symbol: string
): Promise<TechnicalIndicators> {
  const closes = await fetchKlineCloses(symbol);

  const rsi = calculateRSI(closes);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  return {
    rsi,
    ema20,
    ema50,
    trend: calculateEMATrend(ema20, ema50),
  };
}

export async function getRSI(symbol: string) {
  const indicators = await getTechnicalIndicators(symbol);
  return indicators.rsi;
}