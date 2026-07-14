"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type Time,
} from "lightweight-charts";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
};

type CandlestickChartProps = {
  candles: Candle[];
};

export default function CandlestickChart({
  candles,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) {
      return;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 620,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "#09090b",
        },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: {
          color: "#27272a",
        },
        horzLines: {
          color: "#27272a",
        },
      },
      rightPriceScale: {
        borderColor: "#3f3f46",
      },
      timeScale: {
        borderColor: "#3f3f46",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
    });

    const ema20Series = chart.addSeries(LineSeries, {
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const ema50Series = chart.addSeries(LineSeries, {
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const candlestickData: CandlestickData<Time>[] = candles.map((candle) => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData: HistogramData<Time>[] = candles.map((candle) => ({
      time: candle.time as Time,
      value: candle.volume,
      color: candle.close >= candle.open ? "#22c55e80" : "#ef444480",
    }));

    const ema20Data: LineData<Time>[] = candles
      .filter((candle) => candle.ema20 !== undefined)
      .map((candle) => ({
        time: candle.time as Time,
        value: candle.ema20 as number,
      }));

    const ema50Data: LineData<Time>[] = candles
      .filter((candle) => candle.ema50 !== undefined)
      .map((candle) => ({
        time: candle.time as Time,
        value: candle.ema50 as number,
      }));

    candlestickSeries.setData(candlestickData);
    volumeSeries.setData(volumeData);
    ema20Series.setData(ema20Data);
    ema50Series.setData(ema50Data);

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      if (!chartContainerRef.current) {
        return;
      }

      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">Price Chart</h2>
        <p className="text-sm text-zinc-500">
          Candlesticks · EMA 20 · EMA 50 · Volume
        </p>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full overflow-hidden rounded-xl"
      />
    </div>
  );
}