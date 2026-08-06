export type PositionSizeInput = {
  accountSize: number;
  riskPercent: number;
  entry: number;
  stopLoss: number;
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
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculatePositionSize(
  input: PositionSizeInput
): PositionSizeResult | null {
  const { accountSize, riskPercent, entry, stopLoss } =
    input;

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

  return {
    dollarRisk: round(dollarRisk, 2),
    riskPerUnit,
    positionSize: round(positionSize, 6),
    positionValue: round(positionValue, 2),
  };
}
