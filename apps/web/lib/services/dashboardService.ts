import { getAtlasScanner } from "../analysis/scanner";

export async function getFearGreed() {
  const response = await fetch("https://api.alternative.me/fng/", {
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Fear & Greed");
  }

  const data = await response.json();

  return {
    value: Number(data.data[0].value),
    label: data.data[0].value_classification as string,
  };
}

export async function getBTCDominance() {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/global",
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch BTC Dominance");
  }

  const data = await response.json();

  return Number(data.data.market_cap_percentage.btc);
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