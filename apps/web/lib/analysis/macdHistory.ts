import { MACD } from "technicalindicators";
import { fetchKlineCloses } from "../api/binance";

export type MACDPoint = {
  macd: number;
  signal: number;
  histogram: number;
};

export async function getMACDHistory(
  symbol: string
): Promise<MACDPoint[]> {
  const closes = await fetchKlineCloses(symbol, "1h", 250);

  return MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  }).map((item) => ({
    macd: item.MACD ?? 0,
    signal: item.signal ?? 0,
    histogram: item.histogram ?? 0,
  }));
}