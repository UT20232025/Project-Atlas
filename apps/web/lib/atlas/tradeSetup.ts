import type {
  AtlasRisk,
  AtlasSignal,
} from "@/lib/atlas/atlasEngine";
import {
  calculateAtr,
  type AtlasCandle,
} from "@/lib/atlas/atlasIndicators";

export type TradeDirection = "LONG" | "SHORT" | "WAIT";

export type AtlasTradeSetup = {
  direction: TradeDirection;
  entry: number | null;
  stopLoss: number | null;
  takeProfit1: number | null;
  takeProfit2: number | null;
  riskReward1: number | null;
  riskReward2: number | null;
  quality: "A" | "B" | "C" | "NO_TRADE";
  explanation: string;
};

type CreateTradeSetupInput = {
  candles: AtlasCandle[];
  signal: AtlasSignal;
  confidence: number;
  risk: AtlasRisk;
};

function roundPrice(value: number): number {
  if (value >= 1000) {
    return Math.round(value * 10) / 10;
  }

  if (value >= 1) {
    return Math.round(value * 100) / 100;
  }

  return Math.round(value * 100000) / 100000;
}

function calculateRiskReward(
  entry: number,
  stopLoss: number,
  takeProfit: number
): number | null {
  const riskDistance = Math.abs(entry - stopLoss);
  const rewardDistance = Math.abs(takeProfit - entry);

  if (riskDistance === 0) {
    return null;
  }

  return (
    Math.round((rewardDistance / riskDistance) * 100) /
    100
  );
}

function getDirection(
  signal: AtlasSignal
): TradeDirection {
  if (
    signal === "LONG" ||
    signal === "STRONG_LONG"
  ) {
    return "LONG";
  }

  if (
    signal === "SHORT" ||
    signal === "STRONG_SHORT"
  ) {
    return "SHORT";
  }

  return "WAIT";
}

function getTradeQuality(
  direction: TradeDirection,
  confidence: number,
  risk: AtlasRisk
): AtlasTradeSetup["quality"] {
  if (direction === "WAIT") {
    return "NO_TRADE";
  }

  if (confidence >= 75 && risk === "LOW") {
    return "A";
  }

  if (confidence >= 65 && risk !== "HIGH") {
    return "B";
  }

  return "C";
}

function getAtrMultiplier(risk: AtlasRisk): number {
  if (risk === "LOW") {
    return 1.25;
  }

  if (risk === "MODERATE") {
    return 1.5;
  }

  return 1.75;
}

function getTargetMultipliers(
  confidence: number,
  quality: AtlasTradeSetup["quality"]
) {
  if (quality === "A" && confidence >= 80) {
    return {
      firstTarget: 1.75,
      secondTarget: 3,
    };
  }

  if (quality === "B") {
    return {
      firstTarget: 1.5,
      secondTarget: 2.5,
    };
  }

  return {
    firstTarget: 1.25,
    secondTarget: 2,
  };
}

function getExplanation(
  direction: TradeDirection,
  risk: AtlasRisk,
  quality: AtlasTradeSetup["quality"],
  atr: number
): string {
  if (direction === "WAIT") {
    return "Atlas does not detect a clear directional advantage. No trade setup is generated.";
  }

  const atrText = roundPrice(atr).toLocaleString();

  if (quality === "A") {
    return `Atlas detects a high-quality ${direction.toLowerCase()} setup. Stop loss and profit targets are adjusted using a 14-period ATR of ${atrText}, with strong indicator alignment and ${risk.toLowerCase()} relative risk.`;
  }

  if (quality === "B") {
    return `Atlas detects a valid ${direction.toLowerCase()} setup. Stop loss and profit targets are adjusted using a 14-period ATR of ${atrText}, although additional confirmation could improve the trade quality.`;
  }

  return `Atlas detects a weaker ${direction.toLowerCase()} setup. Levels are adjusted using a 14-period ATR of ${atrText}. Position sizing and risk control should be handled carefully.`;
}

function createNoTradeSetup(
  explanation: string
): AtlasTradeSetup {
  return {
    direction: "WAIT",
    entry: null,
    stopLoss: null,
    takeProfit1: null,
    takeProfit2: null,
    riskReward1: null,
    riskReward2: null,
    quality: "NO_TRADE",
    explanation,
  };
}

export function createTradeSetup({
  candles,
  signal,
  confidence,
  risk,
}: CreateTradeSetupInput): AtlasTradeSetup {
  const direction = getDirection(signal);
  const latestCandle = candles.at(-1);

  if (!latestCandle || direction === "WAIT") {
    return createNoTradeSetup(
      "Atlas does not detect a clear directional advantage. No trade setup is generated."
    );
  }

  const atr = calculateAtr(candles, 14);

  if (!Number.isFinite(atr) || atr <= 0) {
    return createNoTradeSetup(
      "Atlas could not calculate a reliable ATR value for this setup."
    );
  }

  const entry = latestCandle.close;
  const quality = getTradeQuality(
    direction,
    confidence,
    risk
  );

  const stopDistance =
    atr * getAtrMultiplier(risk);

  const targetMultipliers = getTargetMultipliers(
    confidence,
    quality
  );

  const firstTargetDistance =
    stopDistance * targetMultipliers.firstTarget;

  const secondTargetDistance =
    stopDistance * targetMultipliers.secondTarget;

  const stopLoss =
    direction === "LONG"
      ? entry - stopDistance
      : entry + stopDistance;

  const takeProfit1 =
    direction === "LONG"
      ? entry + firstTargetDistance
      : entry - firstTargetDistance;

  const takeProfit2 =
    direction === "LONG"
      ? entry + secondTargetDistance
      : entry - secondTargetDistance;

  const roundedEntry = roundPrice(entry);
  const roundedStopLoss = roundPrice(stopLoss);
  const roundedTakeProfit1 =
    roundPrice(takeProfit1);
  const roundedTakeProfit2 =
    roundPrice(takeProfit2);

  return {
    direction,
    entry: roundedEntry,
    stopLoss: roundedStopLoss,
    takeProfit1: roundedTakeProfit1,
    takeProfit2: roundedTakeProfit2,
    riskReward1: calculateRiskReward(
      roundedEntry,
      roundedStopLoss,
      roundedTakeProfit1
    ),
    riskReward2: calculateRiskReward(
      roundedEntry,
      roundedStopLoss,
      roundedTakeProfit2
    ),
    quality,
    explanation: getExplanation(
      direction,
      risk,
      quality,
      atr
    ),
  };
}