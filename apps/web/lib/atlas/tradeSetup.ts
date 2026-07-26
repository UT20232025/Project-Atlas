import type {
  AtlasRisk,
  AtlasSignal,
} from "@/lib/atlas/atlasEngine";
import {
  calculateAtr,
  type AtlasCandle,
} from "@/lib/atlas/atlasIndicators";
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
  explanation: string;
};

type CreateTradeSetupInput = {
  candles: AtlasCandle[];
  signal: AtlasSignal;
  confidence: number;
  risk: AtlasRisk;
  priceLevels: AtlasPriceLevels;
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
}: {
  direction: Exclude<TradeDirection, "WAIT">;
  risk: AtlasRisk;
  quality: AtlasTradeSetup["quality"];
  atr: number;
  usedStructureStop: boolean;
  firstTargetLimitedByStructure: boolean;
  secondTargetLimitedByStructure: boolean;
  priceLevels: AtlasPriceLevels;
}): string {
  const parts: string[] = [];

  if (quality === "A") {
    parts.push(
      `Atlas detects a high-quality ${direction.toLowerCase()} setup with strong indicator alignment.`
    );
  } else if (quality === "B") {
    parts.push(
      `Atlas detects a valid ${direction.toLowerCase()} setup with acceptable market alignment.`
    );
  } else {
    parts.push(
      `Atlas detects a weaker ${direction.toLowerCase()} setup that requires careful risk control.`
    );
  }

  parts.push(
    `The 14-period ATR is ${formatPrice(
      atr
    )}, and relative risk is ${risk.toLowerCase()}.`
  );

  if (usedStructureStop) {
    const structureLevel =
      direction === "LONG"
        ? priceLevels.support
        : priceLevels.resistance;

    const levelName =
      direction === "LONG"
        ? "support"
        : "resistance";

    if (structureLevel !== null) {
      parts.push(
        `Stop loss is positioned beyond the nearest ${levelName} level at ${formatPrice(
          structureLevel
        )}, including an ATR safety buffer.`
      );
    }
  } else {
    parts.push(
      "Stop loss is positioned using ATR because no suitable nearby market-structure level was available."
    );
  }

  if (firstTargetLimitedByStructure) {
    const levelName =
      direction === "LONG"
        ? "resistance"
        : "support";

    parts.push(
      `The nearest ${levelName} limits the first profit target and reduces the available reward.`
    );
  } else if (secondTargetLimitedByStructure) {
    const levelName =
      direction === "LONG"
        ? "resistance"
        : "support";

    parts.push(
      `The nearest ${levelName} is used as the second profit target.`
    );
  }

  return parts.join(" ");
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
  priceLevels,
}: CreateTradeSetupInput): AtlasTradeSetup {
  const direction = getDirection(signal);
  const latestCandle = candles.at(-1);

  if (!latestCandle) {
    return createNoTradeSetup(
      "Atlas could not generate a setup because the latest candle is unavailable."
    );
  }

  if (direction === "WAIT") {
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

  if (!Number.isFinite(entry) || entry <= 0) {
    return createNoTradeSetup(
      "Atlas could not determine a valid entry price."
    );
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
    return createNoTradeSetup(
      "Atlas could not calculate a valid stop-loss distance."
    );
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
    return createNoTradeSetup(
      "Atlas could not calculate reliable risk-to-reward values for this setup."
    );
  }

  if (riskReward1 < MINIMUM_RISK_REWARD) {
    const structureMessage =
      targetResult.firstTargetLimitedByStructure
        ? " The nearest market-structure level limits the available profit potential."
        : "";

    return createNoTradeSetup(
      `Atlas rejected this setup because the first target only provides a ${riskReward1.toFixed(
        2
      )}:1 risk-to-reward ratio. A minimum of ${MINIMUM_RISK_REWARD.toFixed(
        2
      )}:1 is required.${structureMessage}`
    );
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
    }),
  };
}