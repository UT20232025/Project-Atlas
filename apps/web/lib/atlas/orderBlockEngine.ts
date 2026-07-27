export type OrderBlockDirection =
  | "BULLISH"
  | "BEARISH";

export type AtlasCandle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: number;
};

export type OrderBlockZone = {
  direction: OrderBlockDirection;

  high: number;
  low: number;
  midpoint: number;

  candleIndex: number;

  mitigated: boolean;
  strength: number;
};

export type OrderBlockResult = {
  bullishOrderBlocks: OrderBlockZone[];
  bearishOrderBlocks: OrderBlockZone[];

  nearestBullishOrderBlock:
    | OrderBlockZone
    | null;

  nearestBearishOrderBlock:
    | OrderBlockZone
    | null;

  currentPrice: number;

  summary: string;
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

function calculateCandleBody(
  candle: AtlasCandle
): number {
  return Math.abs(
    candle.close - candle.open
  );
}

function calculateCandleRange(
  candle: AtlasCandle
): number {
  return Math.max(
    candle.high - candle.low,
    Number.EPSILON
  );
}

function isBullishCandle(
  candle: AtlasCandle
): boolean {
  return candle.close > candle.open;
}

function isBearishCandle(
  candle: AtlasCandle
): boolean {
  return candle.close < candle.open;
}

function calculateZoneStrength(
  impulseCandle: AtlasCandle,
  orderBlockCandle: AtlasCandle
): number {
  const impulseBody =
    calculateCandleBody(
      impulseCandle
    );

  const impulseRange =
    calculateCandleRange(
      impulseCandle
    );

  const orderBlockRange =
    calculateCandleRange(
      orderBlockCandle
    );

  const bodyStrength =
    impulseBody /
    impulseRange;

  const displacementStrength =
    impulseRange /
    orderBlockRange;

  return Math.round(
    clamp(
      bodyStrength * 55 +
        displacementStrength * 20,
      0,
      100
    )
  );
}

function isBullishOrderBlockMitigated(
  candles: AtlasCandle[],
  zone: OrderBlockZone
): boolean {
  return candles
    .slice(zone.candleIndex + 1)
    .some(
      (candle) =>
        candle.low <= zone.high &&
        candle.high >= zone.low
    );
}

function isBearishOrderBlockMitigated(
  candles: AtlasCandle[],
  zone: OrderBlockZone
): boolean {
  return candles
    .slice(zone.candleIndex + 1)
    .some(
      (candle) =>
        candle.high >= zone.low &&
        candle.low <= zone.high
    );
}

function findBullishOrderBlocks(
  candles: AtlasCandle[]
): OrderBlockZone[] {
  const zones: OrderBlockZone[] = [];

  for (
    let index = 0;
    index < candles.length - 1;
    index += 1
  ) {
    const orderBlockCandle =
      candles[index];

    const impulseCandle =
      candles[index + 1];

    const bullishDisplacement =
      isBearishCandle(
        orderBlockCandle
      ) &&
      isBullishCandle(
        impulseCandle
      ) &&
      impulseCandle.close >
        orderBlockCandle.high;

    if (!bullishDisplacement) {
      continue;
    }

    const zone: OrderBlockZone = {
      direction: "BULLISH",

      high:
        orderBlockCandle.open,

      low:
        orderBlockCandle.low,

      midpoint:
        (orderBlockCandle.open +
          orderBlockCandle.low) /
        2,

      candleIndex: index,

      mitigated: false,

      strength:
        calculateZoneStrength(
          impulseCandle,
          orderBlockCandle
        ),
    };

    zone.mitigated =
      isBullishOrderBlockMitigated(
        candles,
        zone
      );

    zones.push(zone);
  }

  return zones;
}

function findBearishOrderBlocks(
  candles: AtlasCandle[]
): OrderBlockZone[] {
  const zones: OrderBlockZone[] = [];

  for (
    let index = 0;
    index < candles.length - 1;
    index += 1
  ) {
    const orderBlockCandle =
      candles[index];

    const impulseCandle =
      candles[index + 1];

    const bearishDisplacement =
      isBullishCandle(
        orderBlockCandle
      ) &&
      isBearishCandle(
        impulseCandle
      ) &&
      impulseCandle.close <
        orderBlockCandle.low;

    if (!bearishDisplacement) {
      continue;
    }

    const zone: OrderBlockZone = {
      direction: "BEARISH",

      high:
        orderBlockCandle.high,

      low:
        orderBlockCandle.open,

      midpoint:
        (orderBlockCandle.high +
          orderBlockCandle.open) /
        2,

      candleIndex: index,

      mitigated: false,

      strength:
        calculateZoneStrength(
          impulseCandle,
          orderBlockCandle
        ),
    };

    zone.mitigated =
      isBearishOrderBlockMitigated(
        candles,
        zone
      );

    zones.push(zone);
  }

  return zones;
}

function findNearestBullishOrderBlock(
  zones: OrderBlockZone[],
  currentPrice: number
): OrderBlockZone | null {
  const validZones =
    zones.filter(
      (zone) =>
        !zone.mitigated &&
        zone.high <= currentPrice
    );

  if (validZones.length === 0) {
    return null;
  }

  return validZones.reduce(
    (nearest, zone) =>
      currentPrice - zone.high <
      currentPrice - nearest.high
        ? zone
        : nearest
  );
}

function findNearestBearishOrderBlock(
  zones: OrderBlockZone[],
  currentPrice: number
): OrderBlockZone | null {
  const validZones =
    zones.filter(
      (zone) =>
        !zone.mitigated &&
        zone.low >= currentPrice
    );

  if (validZones.length === 0) {
    return null;
  }

  return validZones.reduce(
    (nearest, zone) =>
      zone.low - currentPrice <
      nearest.low - currentPrice
        ? zone
        : nearest
  );
}

export function analyzeOrderBlocks(
  candles: AtlasCandle[]
): OrderBlockResult {
  if (candles.length < 3) {
    const currentPrice =
      candles.at(-1)?.close ?? 0;

    return {
      bullishOrderBlocks: [],
      bearishOrderBlocks: [],

      nearestBullishOrderBlock:
        null,

      nearestBearishOrderBlock:
        null,

      currentPrice,

      summary:
        "Not enough candle data to detect order blocks.",
    };
  }

  const currentPrice =
    candles.at(-1)?.close ?? 0;

  const bullishOrderBlocks =
    findBullishOrderBlocks(
      candles
    );

  const bearishOrderBlocks =
    findBearishOrderBlocks(
      candles
    );

  const nearestBullishOrderBlock =
    findNearestBullishOrderBlock(
      bullishOrderBlocks,
      currentPrice
    );

  const nearestBearishOrderBlock =
    findNearestBearishOrderBlock(
      bearishOrderBlocks,
      currentPrice
    );

  const activeBullishCount =
    bullishOrderBlocks.filter(
      (zone) => !zone.mitigated
    ).length;

  const activeBearishCount =
    bearishOrderBlocks.filter(
      (zone) => !zone.mitigated
    ).length;

  return {
    bullishOrderBlocks,
    bearishOrderBlocks,

    nearestBullishOrderBlock,
    nearestBearishOrderBlock,

    currentPrice,

    summary:
      `Detected ${activeBullishCount} active bullish order block(s) ` +
      `and ${activeBearishCount} active bearish order block(s).`,
  };
}