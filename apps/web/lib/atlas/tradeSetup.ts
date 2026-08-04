import type {
  AtlasRisk,
  AtlasSignal,
} from "@/lib/atlas/atlasEngine";
import {
  calculateAtr,
  type AtlasCandle,
} from "@/lib/atlas/atlasIndicators";
import type { FairValueGapResult } from "@/lib/atlas/fairValueGapEngine";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import type { AtlasPriceLevels } from "@/lib/atlas/supportResistance";

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
  explanation: AtlasReasonCode[];
};

type CreateTradeSetupInput = {
  candles: AtlasCandle[];
  signal: AtlasSignal;
  confidence: number;
  risk: AtlasRisk;
  priceLevels: AtlasPriceLevels;
  fairValueGaps: FairValueGapResult;
};

type StopLossResult = {
  stopLoss: number;
  usedStructure: boolean;
};

type TakeProfitResult = {
  takeProfit1: number;
  takeProfit2: number;
  firstTargetLimitedByStructure: boolean;
  secondTargetLimitedByStructure: boolean;
};

const MINIMUM_RISK_REWARD = 1.5;
const STRUCTURE_BUFFER_ATR = 0.25;
const MAXIMUM_STRUCTURE_STOP_ATR = 2.5;

function roundPrice(value: number): number {
  if (value >= 1000) {
    return Math.round(value * 10) / 10;
  }

  if (value >= 1) {
    return Math.round(value * 100) / 100;
  }

  return Math.round(value * 100000) / 100000;
}

function formatPrice(value: number): string {
  return roundPrice(value).toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
}

function calculateRiskReward(
  entry: number,
  stopLoss: number,
  takeProfit: number
): number | null {
  const riskDistance = Math.abs(entry - stopLoss);
  const rewardDistance = Math.abs(takeProfit - entry);

  if (
    !Number.isFinite(riskDistance) ||
    !Number.isFinite(rewardDistance) ||
    riskDistance <= 0
  ) {
    return null;
  }

  return Math.round((rewardDistance / riskDistance) * 100) / 100;
}

function getDirection(signal: AtlasSignal): TradeDirection {
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

function adjustQualityForReward(
  quality: AtlasTradeSetup["quality"],
  riskReward1: number,
  riskReward2: number
): AtlasTradeSetup["quality"] {
  if (quality === "NO_TRADE") {
    return "NO_TRADE";
  }

  if (
    quality === "A" &&
    (riskReward1 < 1.75 || riskReward2 < 2.5)
  ) {
    return "B";
  }

  if (
    quality === "B" &&
    riskReward2 < 2
  ) {
    return "C";
  }

  return quality;
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
    firstTarget: 1.5,
    secondTarget: 2,
  };
}

function getStopLoss({
  direction,
  entry,
  atr,
  risk,
  priceLevels,
}: {
  direction: Exclude<TradeDirection, "WAIT">;
  entry: number;
  atr: number;
  risk: AtlasRisk;
  priceLevels: AtlasPriceLevels;
}): StopLossResult {
  const atrStopDistance =
    atr * getAtrMultiplier(risk);

  const atrStopLoss =
    direction === "LONG"
      ? entry - atrStopDistance
      : entry + atrStopDistance;

  const structureLevel =
    direction === "LONG"
      ? priceLevels.support
      : priceLevels.resistance;

  if (
    structureLevel === null ||
    !Number.isFinite(structureLevel)
  ) {
    return {
      stopLoss: atrStopLoss,
      usedStructure: false,
    };
  }

  const validStructureLevel =
    direction === "LONG"
      ? structureLevel < entry
      : structureLevel > entry;

  if (!validStructureLevel) {
    return {
      stopLoss: atrStopLoss,
      usedStructure: false,
    };
  }

  const structureBuffer =
    atr * STRUCTURE_BUFFER_ATR;

  const structureStopLoss =
    direction === "LONG"
      ? structureLevel - structureBuffer
      : structureLevel + structureBuffer;

  const structureStopDistance = Math.abs(
    entry - structureStopLoss
  );

  const maximumStructureDistance =
    atr * MAXIMUM_STRUCTURE_STOP_ATR;

  if (
    structureStopDistance <= 0 ||
    structureStopDistance > maximumStructureDistance
  ) {
    return {
      stopLoss: atrStopLoss,
      usedStructure: false,
    };
  }

  return {
    stopLoss: structureStopLoss,
    usedStructure: true,
  };
}

function getTakeProfits({
  direction,
  entry,
  riskDistance,
  confidence,
  quality,
  priceLevels,
}: {
  direction: Exclude<TradeDirection, "WAIT">;
  entry: number;
  riskDistance: number;
  confidence: number;
  quality: AtlasTradeSetup["quality"];
  priceLevels: AtlasPriceLevels;
}): TakeProfitResult {
  const targetMultipliers = getTargetMultipliers(
    confidence,
    quality
  );

  const firstTargetDistance =
    riskDistance * targetMultipliers.firstTarget;

  const secondTargetDistance =
    riskDistance * targetMultipliers.secondTarget;

  let takeProfit1 =
    direction === "LONG"
      ? entry + firstTargetDistance
      : entry - firstTargetDistance;

  let takeProfit2 =
    direction === "LONG"
      ? entry + secondTargetDistance
      : entry - secondTargetDistance;

  let firstTargetLimitedByStructure = false;
  let secondTargetLimitedByStructure = false;

  const structureTarget =
    direction === "LONG"
      ? priceLevels.resistance
      : priceLevels.support;

  if (
    structureTarget === null ||
    !Number.isFinite(structureTarget)
  ) {
    return {
      takeProfit1,
      takeProfit2,
      firstTargetLimitedByStructure,
      secondTargetLimitedByStructure,
    };
  }

  const validStructureTarget =
    direction === "LONG"
      ? structureTarget > entry
      : structureTarget < entry;

  if (!validStructureTarget) {
    return {
      takeProfit1,
      takeProfit2,
      firstTargetLimitedByStructure,
      secondTargetLimitedByStructure,
    };
  }

  if (direction === "LONG") {
    if (structureTarget <= takeProfit1) {
      takeProfit1 = structureTarget;
      firstTargetLimitedByStructure = true;
    } else if (structureTarget < takeProfit2) {
      takeProfit2 = structureTarget;
      secondTargetLimitedByStructure = true;
    }
  } else {
    if (structureTarget >= takeProfit1) {
      takeProfit1 = structureTarget;
      firstTargetLimitedByStructure = true;
    } else if (structureTarget > takeProfit2) {
      takeProfit2 = structureTarget;
      secondTargetLimitedByStructure = true;
    }
  }

  return {
    takeProfit1,
    takeProfit2,
    firstTargetLimitedByStructure,
    secondTargetLimitedByStructure,
  };
}

function createExplanation({
  direction,
  risk,
  quality,
  atr,
  usedStructureStop,
  firstTargetLimitedByStructure,
  secondTargetLimitedByStructure,
  priceLevels,
  fairValueGaps,
}: {
  direction: Exclude<TradeDirection, "WAIT">;
  risk: AtlasRisk;
  quality: AtlasTradeSetup["quality"];
  atr: number;
  usedStructureStop: boolean;
  firstTargetLimitedByStructure: boolean;
  secondTargetLimitedByStructure: boolean;
  priceLevels: AtlasPriceLevels;
  fairValueGaps: FairValueGapResult;
}): AtlasReasonCode[] {
  const parts: AtlasReasonCode[] = [];

  if (quality === "A") {
    parts.push({
      code: "TRADE_SETUP_QUALITY_A",
      params: { direction },
    });
  } else if (quality === "B") {
    parts.push({
      code: "TRADE_SETUP_QUALITY_B",
      params: { direction },
    });
  } else {
    parts.push({
      code: "TRADE_SETUP_QUALITY_C",
      params: { direction },
    });
  }

  const atrRiskCode =
    risk === "LOW"
      ? "TRADE_SETUP_ATR_RISK_LOW"
      : risk === "MODERATE"
        ? "TRADE_SETUP_ATR_RISK_MODERATE"
        : "TRADE_SETUP_ATR_RISK_HIGH";

  parts.push({
    code: atrRiskCode,
    params: { atr: formatPrice(atr) },
  });

  if (usedStructureStop) {
    const structureLevel =
      direction === "LONG"
        ? priceLevels.support
        : priceLevels.resistance;

    if (structureLevel !== null) {
      parts.push({
        code:
          direction === "LONG"
            ? "TRADE_SETUP_STOP_STRUCTURE_SUPPORT"
            : "TRADE_SETUP_STOP_STRUCTURE_RESISTANCE",
        params: { level: formatPrice(structureLevel) },
      });
    }
  } else {
    parts.push({ code: "TRADE_SETUP_STOP_ATR" });
  }

  if (firstTargetLimitedByStructure) {
    parts.push({
      code:
        direction === "LONG"
          ? "TRADE_SETUP_TARGET1_LIMITED_RESISTANCE"
          : "TRADE_SETUP_TARGET1_LIMITED_SUPPORT",
    });
  } else if (secondTargetLimitedByStructure) {
    parts.push({
      code:
        direction === "LONG"
          ? "TRADE_SETUP_TARGET2_LIMITED_RESISTANCE"
          : "TRADE_SETUP_TARGET2_LIMITED_SUPPORT",
    });
  }

  if (
    direction === "LONG" &&
    fairValueGaps.nearestBullishFairValueGap
  ) {
    parts.push({
      code: "TRADE_SETUP_FVG_BULLISH_SUPPORT",
      params: {
        level: formatPrice(
          fairValueGaps.nearestBullishFairValueGap.midpoint
        ),
      },
    });
  }

  if (
    direction === "SHORT" &&
    fairValueGaps.nearestBearishFairValueGap
  ) {
    parts.push({
      code: "TRADE_SETUP_FVG_BEARISH_RESISTANCE",
      params: {
        level: formatPrice(
          fairValueGaps.nearestBearishFairValueGap.midpoint
        ),
      },
    });
  }

  return parts;
}

function createNoTradeSetup(
  explanation: AtlasReasonCode[]
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
  priceLevels,
  fairValueGaps,
}: CreateTradeSetupInput): AtlasTradeSetup {
  const direction = getDirection(signal);
  const latestCandle = candles.at(-1);

  if (!latestCandle) {
    return createNoTradeSetup([
      { code: "TRADE_SETUP_NO_LATEST_CANDLE" },
    ]);
  }

  if (direction === "WAIT") {
    return createNoTradeSetup([
      { code: "TRADE_SETUP_NO_DIRECTION" },
    ]);
  }

  const atr = calculateAtr(candles, 14);

  if (!Number.isFinite(atr) || atr <= 0) {
    return createNoTradeSetup([
      { code: "TRADE_SETUP_NO_ATR" },
    ]);
  }

  const entry = latestCandle.close;

  if (!Number.isFinite(entry) || entry <= 0) {
    return createNoTradeSetup([
      { code: "TRADE_SETUP_NO_ENTRY" },
    ]);
  }

  const initialQuality = getTradeQuality(
    direction,
    confidence,
    risk
  );

  const stopResult = getStopLoss({
    direction,
    entry,
    atr,
    risk,
    priceLevels,
  });

  const riskDistance = Math.abs(
    entry - stopResult.stopLoss
  );

  if (
    !Number.isFinite(riskDistance) ||
    riskDistance <= 0
  ) {
    return createNoTradeSetup([
      { code: "TRADE_SETUP_NO_STOP_DISTANCE" },
    ]);
  }

  const targetResult = getTakeProfits({
    direction,
    entry,
    riskDistance,
    confidence,
    quality: initialQuality,
    priceLevels,
  });

  const roundedEntry = roundPrice(entry);
  const roundedStopLoss = roundPrice(
    stopResult.stopLoss
  );
  const roundedTakeProfit1 = roundPrice(
    targetResult.takeProfit1
  );
  const roundedTakeProfit2 = roundPrice(
    targetResult.takeProfit2
  );

  const riskReward1 = calculateRiskReward(
    roundedEntry,
    roundedStopLoss,
    roundedTakeProfit1
  );

  const riskReward2 = calculateRiskReward(
    roundedEntry,
    roundedStopLoss,
    roundedTakeProfit2
  );

  if (
    riskReward1 === null ||
    riskReward2 === null
  ) {
    return createNoTradeSetup([
      { code: "TRADE_SETUP_NO_RISK_REWARD" },
    ]);
  }

  if (riskReward1 < MINIMUM_RISK_REWARD) {
    const explanation: AtlasReasonCode[] = [
      {
        code: "TRADE_SETUP_REJECTED_LOW_RR",
        params: {
          riskReward1: riskReward1.toFixed(2),
          minimumRiskReward: MINIMUM_RISK_REWARD.toFixed(2),
        },
      },
    ];

    if (targetResult.firstTargetLimitedByStructure) {
      explanation.push({
        code: "TRADE_SETUP_STRUCTURE_LIMITS_PROFIT",
      });
    }

    return createNoTradeSetup(explanation);
  }

  const finalQuality = adjustQualityForReward(
    initialQuality,
    riskReward1,
    riskReward2
  );

  return {
    direction,
    entry: roundedEntry,
    stopLoss: roundedStopLoss,
    takeProfit1: roundedTakeProfit1,
    takeProfit2: roundedTakeProfit2,
    riskReward1,
    riskReward2,
    quality: finalQuality,
    explanation: createExplanation({
      direction,
      risk,
      quality: finalQuality,
      atr,
      usedStructureStop:
        stopResult.usedStructure,
      firstTargetLimitedByStructure:
        targetResult.firstTargetLimitedByStructure,
      secondTargetLimitedByStructure:
        targetResult.secondTargetLimitedByStructure,
      priceLevels,
      fairValueGaps,
    }),
  };
}
