import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
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
  explanation: AtlasReasonCode;
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

  const buyVolumeText = `$${Math.round(whaleBuyVolumeUsd).toLocaleString("en-US")}`;
  const sellVolumeText = `$${Math.round(whaleSellVolumeUsd).toLocaleString("en-US")}`;

  const explanation: AtlasReasonCode =
    whaleTrades.length === 0
      ? { code: "WHALE_NO_LARGE_TRADES" }
      : netBias === "BULLISH"
        ? {
            code: "WHALE_BULLISH_DOMINANCE",
            params: { buyVolume: buyVolumeText, sellVolume: sellVolumeText },
          }
        : netBias === "BEARISH"
          ? {
              code: "WHALE_BEARISH_DOMINANCE",
              params: { buyVolume: buyVolumeText, sellVolume: sellVolumeText },
            }
          : { code: "WHALE_BALANCED" };

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
