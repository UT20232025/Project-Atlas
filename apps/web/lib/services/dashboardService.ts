import { getAtlasScanner } from "../analysis/scanner";

export async function getFearGreed() {
  const response = await fetch(
    "https://api.alternative.me/fng/",
    {
      next: {
        revalidate: 3600,
      },
    }
  );

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
  const [scanner, fearGreed, btcDominance] =
    await Promise.all([
      getAtlasScanner(),
      getFearGreed(),
      getBTCDominance(),
    ]);

  const bullish = scanner.filter(
    (x) => x.trend === "BULLISH"
  ).length;

  const bearish = scanner.filter(
    (x) => x.trend === "BEARISH"
  ).length;

  const neutral = scanner.filter(
    (x) => x.trend === "NEUTRAL"
  ).length;

  return {
    scanner,
    fearGreed,
    btcDominance,
    bullish,
    bearish,
    neutral,
  };
}