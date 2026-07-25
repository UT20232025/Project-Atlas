export function calculateEmaSeries(
  values: number[],
  period: number
): number[] {
  if (period <= 0) {
    throw new Error("EMA period must be greater than zero.");
  }

  if (values.length === 0) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const emaValues: number[] = [values[0]];

  for (let index = 1; index < values.length; index += 1) {
    const previousEma = emaValues[index - 1];

    const nextEma =
      values[index] * multiplier +
      previousEma * (1 - multiplier);

    emaValues.push(nextEma);
  }

  return emaValues;
}

export function calculateLatestEma(
  values: number[],
  period: number
): number {
  return calculateEmaSeries(values, period).at(-1) ?? 0;
}
