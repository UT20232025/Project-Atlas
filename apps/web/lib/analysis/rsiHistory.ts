import { RSI } from "technicalindicators";
import { fetchKlineCloses } from "../api/binance";
import type { BinanceInterval } from "../services/binanceCandleService";

export async function getRSIHistory(
  symbol: string,
  interval: BinanceInterval = "1h",
  period = 14
): Promise<number[]> {
  const closes = await fetchKlineCloses(symbol, interval, 250);

  return RSI.calculate({
    values: closes,
    period,
  });
}