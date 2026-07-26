import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";

export type LiquiditySweepDirection =
  | "BULLISH"
  | "BEARISH"
  | "NONE";

export type LiquidityPool = {
  level: number;
  touches: number;
  firstIndex: number;
  lastIndex: number;
};

export type LiquiditySweep = {
  detected: boolean;
  direction: LiquiditySweepDirection;
  level: number | null;
  candleIndex: number | null;
  penetration: number;
  rejectionStrength: number;
};

export type LiquidityResult = {
  equalHighs: boolean;
  equalLows: boolean;

  liquidityAbove: number | null;
  liquidityBelow: number | null;

  highPool: LiquidityPool | null;
  lowPool: LiquidityPool | null;

  bullishSweep: boolean;
  bearishSweep: boolean;

  sweepDirection: LiquiditySweepDirection;
  sweepLevel: number | null;
  sweepCandleIndex: number | null;

  confidence: number;
  explanation: string;
};

type SwingPoint = {
  index: number;
  price: number;
};

type LiquidityEngineOptions = {
  swingRadius: number;
  minimumTouches: number;
  tolerancePercentage: number;
  rangeToleranceMultiplier: number;
  sweepLookback: number;
  minimumPenetrationMultiplier: number;
};

const DEFAULT_OPTIONS: LiquidityEngineOptions = {
  swingRadius: 2,
  minimumTouches: 2,
  tolerancePercentage: 0.0015,
  rangeToleranceMultiplier: 0.2,
  sweepLookback: 12,
  minimumPenetrationMultiplier: 0.05,
};

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}

function calculateAverageRange(
  candles: AtlasCandle[],
  period = 20
): number {
  if (candles.length === 0) {
    return 0;
  }

  const startIndex = Math.max(
    0,
    candles.length - period
  );

  const selectedCandles =
    candles.slice(startIndex);

  const totalRange =
    selectedCandles.reduce(
      (sum, candle) =>
        sum +
        Math.max(
          0,
          candle.high - candle.low
        ),
      0
    );

  return selectedCandles.length > 0
    ? totalRange /
        selectedCandles.length
    : 0;
}

function findSwingHighs(
  candles: AtlasCandle[],
  radius: number
): SwingPoint[] {
  const swingHighs: SwingPoint[] = [];

  for (
    let index = radius;
    index < candles.length - radius;
    index++
  ) {
    const currentHigh =
      candles[index].high;

    let isSwingHigh = true;

    for (
      let offset = 1;
      offset <= radius;
      offset++
    ) {
      if (
        currentHigh <=
          candles[index - offset].high ||
        currentHigh <=
          candles[index + offset].high
      ) {
        isSwingHigh = false;
        break;
      }
    }

    if (isSwingHigh) {
      swingHighs.push({
        index,
        price: currentHigh,
      });
    }
  }

  return swingHighs;
}

function findSwingLows(
  candles: AtlasCandle[],
  radius: number
): SwingPoint[] {
  const swingLows: SwingPoint[] = [];

  for (
    let index = radius;
    index < candles.length - radius;
    index++
  ) {
    const currentLow =
      candles[index].low;

    let isSwingLow = true;

    for (
      let offset = 1;
      offset <= radius;
      offset++
    ) {
      if (
        currentLow >=
          candles[index - offset].low ||
        currentLow >=
          candles[index + offset].low
      ) {
        isSwingLow = false;
        break;
      }
    }

    if (isSwingLow) {
      swingLows.push({
        index,
        price: currentLow,
      });
    }
  }

  return swingLows;
}

function calculateTolerance(
  price: number,
  averageRange: number,
  options: LiquidityEngineOptions
): number {
  const percentageTolerance =
    Math.abs(price) *
    options.tolerancePercentage;

  const rangeTolerance =
    averageRange *
    options.rangeToleranceMultiplier;

  return Math.max(
    percentageTolerance,
    rangeTolerance
  );
}

function findLatestLiquidityPool(
  swingPoints: SwingPoint[],
  averageRange: number,
  options: LiquidityEngineOptions
): LiquidityPool | null {
  if (
    swingPoints.length <
    options.minimumTouches
  ) {
    return null;
  }

  let latestPool: LiquidityPool | null =
    null;

  for (
    let startIndex = 0;
    startIndex < swingPoints.length;
    startIndex++
  ) {
    const anchor =
      swingPoints[startIndex];

    const matchingPoints: SwingPoint[] =
      [anchor];

    let runningLevel = anchor.price;

    for (
      let comparisonIndex =
        startIndex + 1;
      comparisonIndex <
      swingPoints.length;
      comparisonIndex++
    ) {
      const candidate =
        swingPoints[comparisonIndex];

      const tolerance =
        calculateTolerance(
          runningLevel,
          averageRange,
          options
        );

      if (
        Math.abs(
          candidate.price -
            runningLevel
        ) <= tolerance
      ) {
        matchingPoints.push(candidate);

        runningLevel =
          matchingPoints.reduce(
            (sum, point) =>
              sum + point.price,
            0
          ) / matchingPoints.length;
      }
    }

    if (
      matchingPoints.length <
      options.minimumTouches
    ) {
      continue;
    }

    const firstPoint =
      matchingPoints[0];

    const lastPoint =
      matchingPoints[
        matchingPoints.length - 1
      ];

    const pool: LiquidityPool = {
      level: runningLevel,
      touches: matchingPoints.length,
      firstIndex: firstPoint.index,
      lastIndex: lastPoint.index,
    };

    if (
      latestPool === null ||
      pool.lastIndex >
        latestPool.lastIndex ||
      (
        pool.lastIndex ===
          latestPool.lastIndex &&
        pool.touches >
          latestPool.touches
      )
    ) {
      latestPool = pool;
    }
  }

  return latestPool;
}

function detectBearishSweep(
  candles: AtlasCandle[],
  pool: LiquidityPool | null,
  averageRange: number,
  options: LiquidityEngineOptions
): LiquiditySweep {
  if (pool === null) {
    return {
      detected: false,
      direction: "NONE",
      level: null,
      candleIndex: null,
      penetration: 0,
      rejectionStrength: 0,
    };
  }

  const firstPossibleIndex =
    pool.lastIndex + 1;

  const lookbackStart =
    Math.max(
      firstPossibleIndex,
      candles.length -
        options.sweepLookback
    );

  const minimumPenetration =
    averageRange *
    options.minimumPenetrationMultiplier;

  let latestSweep:
    LiquiditySweep | null = null;

  for (
    let index = lookbackStart;
    index < candles.length;
    index++
  ) {
    const candle = candles[index];

    const penetration =
      candle.high - pool.level;

    const candleRange =
      Math.max(
        candle.high - candle.low,
        Number.EPSILON
      );

    const upperWick =
      candle.high -
      Math.max(
        candle.open,
        candle.close
      );

    const rejectionStrength =
      clamp(
        upperWick / candleRange,
        0,
        1
      );

    const sweptAbove =
      penetration >
      minimumPenetration;

    const closedBackBelow =
      candle.close < pool.level;

    if (
      sweptAbove &&
      closedBackBelow
    ) {
      latestSweep = {
        detected: true,
        direction: "BEARISH",
        level: pool.level,
        candleIndex: index,
        penetration,
        rejectionStrength,
      };
    }
  }

  return (
    latestSweep ?? {
      detected: false,
      direction: "NONE",
      level: pool.level,
      candleIndex: null,
      penetration: 0,
      rejectionStrength: 0,
    }
  );
}

function detectBullishSweep(
  candles: AtlasCandle[],
  pool: LiquidityPool | null,
  averageRange: number,
  options: LiquidityEngineOptions
): LiquiditySweep {
  if (pool === null) {
    return {
      detected: false,
      direction: "NONE",
      level: null,
      candleIndex: null,
      penetration: 0,
      rejectionStrength: 0,
    };
  }

  const firstPossibleIndex =
    pool.lastIndex + 1;

  const lookbackStart =
    Math.max(
      firstPossibleIndex,
      candles.length -
        options.sweepLookback
    );

  const minimumPenetration =
    averageRange *
    options.minimumPenetrationMultiplier;

  let latestSweep:
    LiquiditySweep | null = null;

  for (
    let index = lookbackStart;
    index < candles.length;
    index++
  ) {
    const candle = candles[index];

    const penetration =
      pool.level - candle.low;

    const candleRange =
      Math.max(
        candle.high - candle.low,
        Number.EPSILON
      );

    const lowerWick =
      Math.min(
        candle.open,
        candle.close
      ) - candle.low;

    const rejectionStrength =
      clamp(
        lowerWick / candleRange,
        0,
        1
      );

    const sweptBelow =
      penetration >
      minimumPenetration;

    const closedBackAbove =
      candle.close > pool.level;

    if (
      sweptBelow &&
      closedBackAbove
    ) {
      latestSweep = {
        detected: true,
        direction: "BULLISH",
        level: pool.level,
        candleIndex: index,
        penetration,
        rejectionStrength,
      };
    }
  }

  return (
    latestSweep ?? {
      detected: false,
      direction: "NONE",
      level: pool.level,
      candleIndex: null,
      penetration: 0,
      rejectionStrength: 0,
    }
  );
}

function calculateSweepConfidence(
  sweep: LiquiditySweep,
  pool: LiquidityPool | null,
  averageRange: number,
  candleCount: number
): number {
  if (
    !sweep.detected ||
    pool === null ||
    sweep.candleIndex === null
  ) {
    return 0;
  }

  const touchScore =
    clamp(
      35 +
        (pool.touches - 2) * 8,
      35,
      59
    );

  const normalizedPenetration =
    averageRange > 0
      ? sweep.penetration /
        averageRange
      : 0;

  const penetrationScore =
    clamp(
      normalizedPenetration * 20,
      5,
      20
    );

  const rejectionScore =
    clamp(
      sweep.rejectionStrength * 20,
      0,
      20
    );

  const candlesSinceSweep =
    Math.max(
      0,
      candleCount -
        1 -
        sweep.candleIndex
    );

  const recencyScore =
    clamp(
      10 - candlesSinceSweep * 2,
      0,
      10
    );

  return Math.round(
    clamp(
      touchScore +
        penetrationScore +
        rejectionScore +
        recencyScore,
      0,
      100
    )
  );
}

export function analyzeLiquidity(
  candles: AtlasCandle[],
  customOptions: Partial<LiquidityEngineOptions> = {}
): LiquidityResult {
  const options: LiquidityEngineOptions = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
  };

  if (
    candles.length <
    options.swingRadius * 2 + 3
  ) {
    return {
      equalHighs: false,
      equalLows: false,

      liquidityAbove: null,
      liquidityBelow: null,

      highPool: null,
      lowPool: null,

      bullishSweep: false,
      bearishSweep: false,

      sweepDirection: "NONE",
      sweepLevel: null,
      sweepCandleIndex: null,

      confidence: 0,

      explanation:
        "Not enough candle data to analyze liquidity.",
    };
  }

  const averageRange =
    calculateAverageRange(candles);

  const swingHighs =
    findSwingHighs(
      candles,
      options.swingRadius
    );

  const swingLows =
    findSwingLows(
      candles,
      options.swingRadius
    );

  const highPool =
    findLatestLiquidityPool(
      swingHighs,
      averageRange,
      options
    );

  const lowPool =
    findLatestLiquidityPool(
      swingLows,
      averageRange,
      options
    );

  const bearishSweepResult =
    detectBearishSweep(
      candles,
      highPool,
      averageRange,
      options
    );

  const bullishSweepResult =
    detectBullishSweep(
      candles,
      lowPool,
      averageRange,
      options
    );

  const bearishConfidence =
    calculateSweepConfidence(
      bearishSweepResult,
      highPool,
      averageRange,
      candles.length
    );

  const bullishConfidence =
    calculateSweepConfidence(
      bullishSweepResult,
      lowPool,
      averageRange,
      candles.length
    );

  let selectedSweep:
    LiquiditySweep | null = null;

  let confidence = 0;

  if (
    bullishSweepResult.detected &&
    bearishSweepResult.detected
  ) {
    const bullishIndex =
      bullishSweepResult.candleIndex ??
      -1;

    const bearishIndex =
      bearishSweepResult.candleIndex ??
      -1;

    if (
      bullishIndex >
      bearishIndex
    ) {
      selectedSweep =
        bullishSweepResult;

      confidence =
        bullishConfidence;
    } else if (
      bearishIndex >
      bullishIndex
    ) {
      selectedSweep =
        bearishSweepResult;

      confidence =
        bearishConfidence;
    } else if (
      bullishConfidence >=
      bearishConfidence
    ) {
      selectedSweep =
        bullishSweepResult;

      confidence =
        bullishConfidence;
    } else {
      selectedSweep =
        bearishSweepResult;

      confidence =
        bearishConfidence;
    }
  } else if (
    bullishSweepResult.detected
  ) {
    selectedSweep =
      bullishSweepResult;

    confidence =
      bullishConfidence;
  } else if (
    bearishSweepResult.detected
  ) {
    selectedSweep =
      bearishSweepResult;

    confidence =
      bearishConfidence;
  }

  const equalHighs =
    highPool !== null;

  const equalLows =
    lowPool !== null;

  let explanation =
    "No clear liquidity pool or liquidity sweep detected.";

  if (
    selectedSweep?.direction ===
    "BULLISH"
  ) {
    explanation =
      "Bullish liquidity sweep detected below equal lows. Price traded below the liquidity level and closed back above it.";
  } else if (
    selectedSweep?.direction ===
    "BEARISH"
  ) {
    explanation =
      "Bearish liquidity sweep detected above equal highs. Price traded above the liquidity level and closed back below it.";
  } else if (
    equalHighs &&
    equalLows
  ) {
    explanation =
      "Liquidity pools detected above equal highs and below equal lows, but neither pool has been swept.";
  } else if (equalHighs) {
    explanation =
      "Liquidity pool detected above equal highs, but no confirmed bearish sweep has occurred.";
  } else if (equalLows) {
    explanation =
      "Liquidity pool detected below equal lows, but no confirmed bullish sweep has occurred.";
  }

  return {
    equalHighs,
    equalLows,

    liquidityAbove:
      highPool?.level ?? null,

    liquidityBelow:
      lowPool?.level ?? null,

    highPool,
    lowPool,

    bullishSweep:
      bullishSweepResult.detected,

    bearishSweep:
      bearishSweepResult.detected,

    sweepDirection:
      selectedSweep?.direction ??
      "NONE",

    sweepLevel:
      selectedSweep?.level ?? null,

    sweepCandleIndex:
      selectedSweep?.candleIndex ??
      null,

    confidence,

    explanation,
  };
}