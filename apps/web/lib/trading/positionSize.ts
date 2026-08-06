export type PositionSizeInput = {
  accountSize: number;
  riskPercent: number;
  entry: number;
  stopLoss: number;
  // Optional target — enables the reward and R-multiple outputs.
  takeProfit?: number;
};

export type PositionSizeResult = {
  // Dollar amount risked on the trade (account × risk%).
  dollarRisk: number;
  // Price distance from entry to stop, per unit.
  riskPerUnit: number;
  // Units to buy/sell so that hitting the stop loses exactly dollarRisk.
  positionSize: number;
  // Notional value of the position (positionSize × entry).
  positionValue: number;
  // Dollar reward if the target is hit (null without a valid takeProfit).
  reward: number | null;
  // Reward-to-risk ratio in R (null without a valid takeProfit).
  rMultiple: number | null;
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculatePositionSize(
  input: PositionSizeInput
): PositionSizeResult | null {
  const {
    accountSize,
    riskPercent,
    entry,
    stopLoss,
    takeProfit,
  } = input;

  if (
    ![accountSize, riskPercent, entry, stopLoss].every(
      (value) => Number.isFinite(value)
    )
  ) {
    return null;
  }

  if (
    accountSize <= 0 ||
    riskPercent <= 0 ||
    entry <= 0
  ) {
    return null;
  }

  const riskPerUnit = Math.abs(entry - stopLoss);

  if (riskPerUnit <= 0) {
    return null;
  }

  const dollarRisk =
    accountSize * (riskPercent / 100);

  const positionSize = dollarRisk / riskPerUnit;
  const positionValue = positionSize * entry;

  let reward: number | null = null;
  let rMultiple: number | null = null;

  if (
    takeProfit != null &&
    Number.isFinite(takeProfit) &&
    takeProfit > 0
  ) {
    const rewardPerUnit = Math.abs(takeProfit - entry);
    reward = round(positionSize * rewardPerUnit, 2);
    rMultiple = round(rewardPerUnit / riskPerUnit, 2);
  }

  return {
    dollarRisk: round(dollarRisk, 2),
    riskPerUnit,
    positionSize: round(positionSize, 6),
    positionValue: round(positionValue, 2),
    reward,
    rMultiple,
  };
}
