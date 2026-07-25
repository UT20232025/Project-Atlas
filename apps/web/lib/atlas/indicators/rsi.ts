export function calculateWilderRsi(
  closes: number[],
  period = 14
): number {
  if (period <= 0) {
    throw new Error("RSI period must be greater than zero.");
  }

  if (closes.length <= period) {
    return 50;
  }

  let totalGain = 0;
  let totalLoss = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = closes[index] - closes[index - 1];

    if (change > 0) {
      totalGain += change;
    } else {
      totalLoss += Math.abs(change);
    }
  }

  let averageGain = totalGain / period;
  let averageLoss = totalLoss / period;

  for (
    let index = period + 1;
    index < closes.length;
    index += 1
  ) {
    const change = closes[index] - closes[index - 1];

    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    averageGain =
      (averageGain * (period - 1) + gain) / period;

    averageLoss =
      (averageLoss * (period - 1) + loss) / period;
  }

  if (averageLoss === 0 && averageGain === 0) {
    return 50;
  }

  if (averageLoss === 0) {
    return 100;
  }

  if (averageGain === 0) {
    return 0;
  }

  const relativeStrength = averageGain / averageLoss;

  return 100 - 100 / (1 + relativeStrength);
}