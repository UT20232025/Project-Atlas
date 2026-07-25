import { calculateEmaSeries } from "./ema";

function clamp(value: number, minimum = -1, maximum = 1): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function calculateMacdScore(closes: number[]): number {
  if (closes.length < 35) {
    return 0;
  }

  const ema12Series = calculateEmaSeries(closes, 12);
  const ema26Series = calculateEmaSeries(closes, 26);

  const macdSeries = closes.map(
    (_, index) => ema12Series[index] - ema26Series[index]
  );

  const signalSeries = calculateEmaSeries(macdSeries, 9);

  const latestMacd = macdSeries.at(-1);
  const latestSignal = signalSeries.at(-1);
  const previousMacd = macdSeries.at(-2);
  const previousSignal = signalSeries.at(-2);
  const latestClose = closes.at(-1);

  if (
    latestMacd === undefined ||
    latestSignal === undefined ||
    previousMacd === undefined ||
    previousSignal === undefined ||
    latestClose === undefined ||
    latestClose === 0
  ) {
    return 0;
  }

  const histogram = latestMacd - latestSignal;
  const previousHistogram = previousMacd - previousSignal;

  const normalizedHistogram = (histogram / latestClose) * 500;

  const histogramDirection =
    histogram > previousHistogram ? 0.25 : -0.25;

  const crossoverBonus =
    previousHistogram <= 0 && histogram > 0
      ? 0.5
      : previousHistogram >= 0 && histogram < 0
        ? -0.5
        : 0;

  return clamp(
    normalizedHistogram +
      histogramDirection +
      crossoverBonus
  );
}