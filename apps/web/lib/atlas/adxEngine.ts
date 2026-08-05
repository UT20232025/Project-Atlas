export type AdxStrength = "STRONG" | "MODERATE" | "WEAK" | "NONE";
export type AdxTrend = "BULLISH" | "BEARISH" | "NONE";

export type AdxResult = {
  adx: number | null;
  plusDi: number | null;
  minusDi: number | null;
  strength: AdxStrength;
  // Directional bias, only set when the trend is at least moderate.
  trend: AdxTrend;
};

type AdxCandle = {
  high: number;
  low: number;
  close: number;
};

const PERIOD = 14;

function wilderSmooth(
  values: number[],
  period: number
): number[] {
  if (values.length < period) {
    return [];
  }

  const smoothed: number[] = [];
  let sum = 0;

  for (let i = 0; i < period; i++) {
    sum += values[i];
  }

  smoothed.push(sum);

  for (let i = period; i < values.length; i++) {
    sum = sum - sum / period + values[i];
    smoothed.push(sum);
  }

  return smoothed;
}

export function analyzeAdx(
  candles: readonly AdxCandle[],
  period: number = PERIOD
): AdxResult {
  const none: AdxResult = {
    adx: null,
    plusDi: null,
    minusDi: null,
    strength: "NONE",
    trend: "NONE",
  };

  if (candles.length < period * 2 + 1) {
    return none;
  }

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const trueRange: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;

    plusDM.push(
      upMove > downMove && upMove > 0 ? upMove : 0
    );
    minusDM.push(
      downMove > upMove && downMove > 0 ? downMove : 0
    );

    trueRange.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      )
    );
  }

  const smPlusDM = wilderSmooth(plusDM, period);
  const smMinusDM = wilderSmooth(minusDM, period);
  const smTr = wilderSmooth(trueRange, period);

  if (smTr.length === 0) {
    return none;
  }

  const dx: number[] = [];

  for (let i = 0; i < smTr.length; i++) {
    const plusDi =
      smTr[i] === 0 ? 0 : (100 * smPlusDM[i]) / smTr[i];
    const minusDi =
      smTr[i] === 0 ? 0 : (100 * smMinusDM[i]) / smTr[i];

    const diSum = plusDi + minusDi;

    dx.push(
      diSum === 0
        ? 0
        : (100 * Math.abs(plusDi - minusDi)) / diSum
    );
  }

  if (dx.length < period) {
    return none;
  }

  let adx = 0;

  for (let i = 0; i < period; i++) {
    adx += dx[i];
  }

  adx = adx / period;

  for (let i = period; i < dx.length; i++) {
    adx = (adx * (period - 1) + dx[i]) / period;
  }

  const lastIndex = smTr.length - 1;

  const plusDi =
    smTr[lastIndex] === 0
      ? 0
      : (100 * smPlusDM[lastIndex]) / smTr[lastIndex];
  const minusDi =
    smTr[lastIndex] === 0
      ? 0
      : (100 * smMinusDM[lastIndex]) / smTr[lastIndex];

  const strength: AdxStrength =
    adx >= 40 ? "STRONG" : adx >= 25 ? "MODERATE" : "WEAK";

  const trend: AdxTrend =
    adx >= 25
      ? plusDi >= minusDi
        ? "BULLISH"
        : "BEARISH"
      : "NONE";

  return {
    adx: Number(adx.toFixed(1)),
    plusDi: Number(plusDi.toFixed(1)),
    minusDi: Number(minusDi.toFixed(1)),
    strength,
    trend,
  };
}
