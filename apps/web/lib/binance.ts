import { calculateAtlasSignal } from "./atlas";

export async function getTicker(symbol: string) {
  const res = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
    {
      next: {
        revalidate: 10,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch ${symbol}`);
  }

  const data = await res.json();

  const atlas = calculateAtlasSignal({
    priceChangePercent: Number(data.priceChangePercent),
    volume: Number(data.quoteVolume),
  });

  return {
    coin: symbol,
    price: Number(data.lastPrice).toFixed(2),
    change: Number(data.priceChangePercent).toFixed(2),
    volume: Number(data.quoteVolume).toFixed(0),
    signal: atlas.signal,
    score: atlas.score,
    reason: atlas.reason,
  };
}

export async function getMarket() {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT"];

  return Promise.all(symbols.map(getTicker));
}