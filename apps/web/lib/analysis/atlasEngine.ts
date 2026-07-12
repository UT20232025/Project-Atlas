import { getTicker, getTechnicalIndicators } from "../binance";

export async function getAtlasAnalysis(symbol: string) {
  const [ticker, indicators] = await Promise.all([
    getTicker(symbol),
    getTechnicalIndicators(symbol),
  ]);

  let confidence = 50;

  if (ticker.signal === "LONG") confidence += 20;
  if (ticker.signal === "SHORT") confidence += 20;

  if (indicators.trend === "BULLISH") confidence += 10;
  if (indicators.trend === "BEARISH") confidence += 10;

  if (indicators.rsi > 45 && indicators.rsi < 65) confidence += 10;

  confidence = Math.min(100, confidence);

  return {
    coin: ticker.coin,
    price: Number(ticker.price),
    change: Number(ticker.change),
    volume: Number(ticker.volume),

    rsi: indicators.rsi,
    ema20: indicators.ema20,
    ema50: indicators.ema50,
    trend: indicators.trend,

    score: ticker.score,
    signal: ticker.signal,
    confidence,

    reasons: ticker.reason,
  };
}