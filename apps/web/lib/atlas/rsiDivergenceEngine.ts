export type RsiDivergence = "BULLISH" | "BEARISH" | "NONE";

export type RsiDivergenceResult = {
  divergence: RsiDivergence;
};

type DivergenceCandle = {
  high: number;
  low: number;
  close: number;
};

const RSI_PERIOD = 14;
const DEFAULT_LOOKBACK = 40;

function rsiSeries(
  closes: number[],
  period: number
): Array<number | null> {
  const rsi: Array<number | null> = new Array(
    closes.length
  ).fill(null);

  if (closes.length <= period) {
    return rsi;
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) avgGain += change;
    else avgLoss -= change;
  }

  avgGain /= period;
  avgLoss /= period;

  rsi[period] =
    avgLoss === 0
      ? 100
      : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi[i] =
      avgLoss === 0
        ? 100
        : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return rsi;
}

// Index of the lowest low within [start, end).
function argMinLow(
  candles: readonly DivergenceCandle[],
  start: number,
  end: number
): number {
  let index = start;
  for (let i = start + 1; i < end; i++) {
    if (candles[i].low < candles[index].low) index = i;
  }
  return index;
}

// Index of the highest high within [start, end).
function argMaxHigh(
  candles: readonly DivergenceCandle[],
  start: number,
  end: number
): number {
  let index = start;
  for (let i = start + 1; i < end; i++) {
    if (candles[i].high > candles[index].high) index = i;
  }
  return index;
}

export function analyzeRsiDivergence(
  candles: readonly DivergenceCandle[],
  lookback: number = DEFAULT_LOOKBACK,
  period: number = RSI_PERIOD
): RsiDivergenceResult {
  const none: RsiDivergenceResult = { divergence: "NONE" };

  if (candles.length < period + 4) {
    return none;
  }

  const rsi = rsiSeries(
    candles.map((candle) => candle.close),
    period
  );

  // Only consider the recent window where RSI is defined.
  const firstValidIndex = rsi.findIndex(
    (value) => value !== null
  );

  if (firstValidIndex === -1) {
    return none;
  }

  const windowStart = Math.max(
    firstValidIndex,
    candles.length - lookback
  );

  const span = candles.length - windowStart;

  if (span < 8) {
    return none;
  }

  const mid = windowStart + Math.floor(span / 2);

  // Compare the extreme of the earlier half with the recent half.
  const earlierLow = argMinLow(candles, windowStart, mid);
  const recentLow = argMinLow(candles, mid, candles.length);

  const earlierHigh = argMaxHigh(candles, windowStart, mid);
  const recentHigh = argMaxHigh(candles, mid, candles.length);

  const bullish =
    candles[recentLow].low < candles[earlierLow].low &&
    (rsi[recentLow] as number) >
      (rsi[earlierLow] as number);

  const bearish =
    candles[recentHigh].high > candles[earlierHigh].high &&
    (rsi[recentHigh] as number) <
      (rsi[earlierHigh] as number);

  // Conflicting signals cancel out.
  if (bullish && !bearish) {
    return { divergence: "BULLISH" };
  }

  if (bearish && !bullish) {
    return { divergence: "BEARISH" };
  }

  return none;
}
