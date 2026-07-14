import { RSI } from "technicalindicators";
import { fetchKlineCloses } from "../api/binance";

export async function getRSIHistory(
  symbol: string,
  period = 14
): Promise<number[]> {
  const closes = await fetchKlineCloses(symbol, "1h", 250);

  return RSI.calculate({
    values: closes,
    period,
  });
}