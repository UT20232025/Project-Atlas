import type { BinanceAggTrade } from "@/lib/services/binanceTradeService";

export const WHALE_TRADE_THRESHOLD_USD = 100_000;

export type WhaleActivityResult = {
  windowTradeCount: number;
  whaleTradeCount: number;
  whaleBuyVolumeUsd: number;
  whaleSellVolumeUsd: number;
  netBias: "BULLISH" | "BEARISH" | "NEUTRAL";
  biasStrength: number;
  largestTrade: {
    quoteQuantity: number;
    side: "BUY" | "SELL";
    time: number;
  } | null;
  explanation: string;
};

export function analyzeWhaleActivity(
  trades: BinanceAggTrade[]
): WhaleActivityResult {
  const whaleTrades = trades.filter(
    (trade) => trade.quoteQuantity >= WHALE_TRADE_THRESHOLD_USD
  );

  let whaleBuyVolumeUsd = 0;
  let whaleSellVolumeUsd = 0;
  let largestTrade: WhaleActivityResult["largestTrade"] = null;

  for (const trade of whaleTrades) {
    const side: "BUY" | "SELL" = trade.isBuyerMaker
      ? "SELL"
      : "BUY";

    if (side === "BUY") {
      whaleBuyVolumeUsd += trade.quoteQuantity;
    } else {
      whaleSellVolumeUsd += trade.quoteQuantity;
    }

    if (
      !largestTrade ||
      trade.quoteQuantity > largestTrade.quoteQuantity
    ) {
      largestTrade = {
        quoteQuantity: trade.quoteQuantity,
        side,
        time: trade.time,
      };
    }
  }

  const totalWhaleVolume = whaleBuyVolumeUsd + whaleSellVolumeUsd;

  let netBias: WhaleActivityResult["netBias"] = "NEUTRAL";
  let biasStrength = 0;

  if (totalWhaleVolume > 0) {
    biasStrength = Math.round(
      (Math.abs(whaleBuyVolumeUsd - whaleSellVolumeUsd) /
        totalWhaleVolume) *
        100
    );

    if (whaleBuyVolumeUsd > whaleSellVolumeUsd * 1.15) {
      netBias = "BULLISH";
    } else if (whaleSellVolumeUsd > whaleBuyVolumeUsd * 1.15) {
      netBias = "BEARISH";
    }
  }

  const explanation =
    whaleTrades.length === 0
      ? "No large trades detected in the recent trade window."
      : netBias === "BULLISH"
        ? `Aggressive buying dominates: $${Math.round(whaleBuyVolumeUsd).toLocaleString("en-US")} in large buys vs $${Math.round(whaleSellVolumeUsd).toLocaleString("en-US")} in large sells.`
        : netBias === "BEARISH"
          ? `Aggressive selling dominates: $${Math.round(whaleSellVolumeUsd).toLocaleString("en-US")} in large sells vs $${Math.round(whaleBuyVolumeUsd).toLocaleString("en-US")} in large buys.`
          : "Large buy and sell volume are roughly balanced.";

  return {
    windowTradeCount: trades.length,
    whaleTradeCount: whaleTrades.length,
    whaleBuyVolumeUsd,
    whaleSellVolumeUsd,
    netBias,
    biasStrength,
    largestTrade,
    explanation,
  };
}
