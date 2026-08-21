import { getAtlasScanner } from "../analysis/scanner";
import { getSignalHistory } from "../atlas/signalHistory";
import type { BinanceInterval } from "../services/binanceCandleService";
import {
  fetchLiveMarketData,
  type MarketSymbol,
} from "../services/liveMarketService";

type FearGreedData = {
  value: number;
  label: string;
};

async function getFearGreed(): Promise<FearGreedData> {
  try {
    const response = await fetch("https://api.alternative.me/fng/", {
      next: {
        revalidate: 3600,
      },
      // Never let a hanging upstream block the dashboard render — fail fast
      // to the fallback below.
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      throw new Error(`Fear & Greed returned ${response.status}`);
    }

    const data = await response.json();
    const item = data?.data?.[0];

    if (!item) {
      throw new Error("Fear & Greed response was empty");
    }

    return {
      value: Number(item.value),
      label: String(item.value_classification),
    };
  } catch (error) {
    console.error("Fear & Greed fetch failed:", error);

    return {
      value: 50,
      label: "Neutral",
    };
  }
}

async function getBTCDominance(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/global",
      {
        next: {
          revalidate: 3600,
        },
        // CoinGecko frequently throttles/blocks datacenter IPs; a hang here
        // must not stall the dashboard, so fail fast to the fallback.
        signal: AbortSignal.timeout(4000),
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }

    const data = await response.json();
    const dominance = Number(data?.data?.market_cap_percentage?.btc);

    if (!Number.isFinite(dominance)) {
      throw new Error("BTC dominance was missing");
    }

    return dominance;
  } catch (error) {
    console.error("BTC dominance fetch failed:", error);

    return 0;
  }
}

// Average perpetual funding rate across a few majors. High positive funding =
// over-leveraged longs paying to stay in — the classic fuel for a liquidation
// cascade, so it feeds the Risk Radar. One Binance call (all symbols) with a
// fast timeout and a null fallback so it can never stall the render.
async function getFundingRate(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://fapi.binance.com/fapi/v1/premiumIndex",
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(4000) }
    );
    if (!response.ok) {
      throw new Error(`Binance premiumIndex ${response.status}`);
    }
    const data = (await response.json()) as Array<{
      symbol: string;
      lastFundingRate: string;
    }>;
    const majors = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
    const rates = data
      .filter((entry) => majors.includes(entry.symbol))
      .map((entry) => Number(entry.lastFundingRate))
      .filter((rate) => Number.isFinite(rate));
    if (rates.length === 0) return null;
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  } catch (error) {
    console.error("Funding rate fetch failed:", error);
    return null;
  }
}

// Cheap data for the top ticker + shell: just three prices plus the
// hour-cached Fear & Greed / dominance. Lets the dashboard shell render
// instantly instead of waiting on the full 20-coin scanner (which streams
// in the body), so the page can't time out on a cold cache.
export async function getMarketTicker() {
  const [market, fearGreed, btcDominance] = await Promise.all([
    fetchLiveMarketData(
      ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as MarketSymbol[],
      AbortSignal.timeout(5000)
    ).catch(() => []),
    getFearGreed(),
    getBTCDominance(),
  ]);

  const find = (symbol: string) =>
    market.find((item) => item.symbol === symbol);

  const btc = find("BTCUSDT");
  const eth = find("ETHUSDT");
  const sol = find("SOLUSDT");

  return {
    btc: btc?.price ?? 0,
    btcChange: btc?.change24h ?? 0,
    eth: eth?.price ?? 0,
    ethChange: eth?.change24h ?? 0,
    sol: sol?.price ?? 0,
    solChange: sol?.change24h ?? 0,
    fearGreed: fearGreed.value,
    btcDominance,
  };
}

// Resolve to a fallback if a promise takes too long, so a slow scanner (many
// cold Binance calls) can never stall the whole dashboard render — the page
// ships with what it has and the client poll fills in the rest.
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function getDashboardData(
  interval: BinanceInterval = "1h"
) {
  const [
    scanner,
    fearGreed,
    btcDominance,
    recentSignalChanges,
    fundingRate,
  ] = await Promise.all([
    withTimeout(getAtlasScanner(interval), 6000, []),
    getFearGreed(),
    getBTCDominance(),
    getSignalHistory(undefined, 15),
    getFundingRate(),
  ]);

  const bullish = scanner.filter(
    (item) => item.trend === "BULLISH"
  ).length;

  const bearish = scanner.filter(
    (item) => item.trend === "BEARISH"
  ).length;

  const neutral = scanner.filter(
    (item) => item.trend === "NEUTRAL"
  ).length;

  const btc = scanner.find((item) => item.coin === "BTCUSDT");
  const eth = scanner.find((item) => item.coin === "ETHUSDT");
  const sol = scanner.find((item) => item.coin === "SOLUSDT");

  return {
    scanner,
    fearGreed,
    btcDominance,
    fundingRate,
    bullish,
    bearish,
    neutral,
    recentSignalChanges,

    marketTicker: {
      btc: btc?.price ?? 0,
      btcChange: btc?.change24h ?? 0,
      eth: eth?.price ?? 0,
      ethChange: eth?.change24h ?? 0,
      sol: sol?.price ?? 0,
      solChange: sol?.change24h ?? 0,
      fearGreed: fearGreed.value,
      btcDominance,
    },
  };
}