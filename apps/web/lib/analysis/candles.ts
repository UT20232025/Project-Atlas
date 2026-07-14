import { EMA } from "technicalindicators";
import { fetchKlines } from "../api/binance";

export type ChartCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
};

export async function getChartCandles(
  symbol: string
): Promise<ChartCandle[]> {
  const klines = await fetchKlines(symbol, "1h", 250);

  const closes = klines.map((candle) => Number(candle[4]));

  const ema20Values = EMA.calculate({
    values: closes,
    period: 20,
  });

  const ema50Values = EMA.calculate({
    values: closes,
    period: 50,
  });

  return klines.map((candle, index) => {
    const ema20Index = index - 19;
    const ema50Index = index - 49;

    return {
      time: Math.floor(candle[0] / 1000),
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      volume: Number(candle[5]),
      ema20:
        ema20Index >= 0
          ? ema20Values[ema20Index]
          : undefined,
      ema50:
        ema50Index >= 0
          ? ema50Values[ema50Index]
          : undefined,
    };
  });
}