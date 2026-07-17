import { getAtlasScanner } from "../analysis/scanner";

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

export async function getDashboardData() {
  const [scanner, fearGreed, btcDominance] = await Promise.all([
    getAtlasScanner(),
    getFearGreed(),
    getBTCDominance(),
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
    bullish,
    bearish,
    neutral,

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