import type { AtlasCandle } from "@/lib/atlas/atlasIndicators";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";

export type VolumeTrend =
  | "INCREASING"
  | "DECREASING"
  | "STABLE";

export type VolumePressure =
  | "BULLISH"
  | "BEARISH"
  | "NEUTRAL";

export type VolumeConfirmation =
  | "CONFIRMED"
  | "WEAK"
  | "NOT_CONFIRMED";

export type VolumeAnalysisResult = {
  latestVolume: number;
  averageVolume: number;
  relativeVolume: number;
  volumeTrend: VolumeTrend;
  pressure: VolumePressure;
  spike: boolean;
  confirmation: VolumeConfirmation;
  confidence: number;
  bullishVolume: number;
  bearishVolume: number;
  explanation: AtlasReasonCode[];
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

function calculateAverage(
  values: number[]
): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (total, value) => total + value,
      0
    ) / values.length
  );
}

function determineVolumeTrend(
  candles: AtlasCandle[]
): VolumeTrend {
  if (candles.length < 20) {
    return "STABLE";
  }

  const recent = candles.slice(-20);
  const firstHalf = recent.slice(0, 10);
  const secondHalf = recent.slice(10);

  const firstAverage = calculateAverage(
    firstHalf.map(
      (candle) => candle.volume
    )
  );

  const secondAverage = calculateAverage(
    secondHalf.map(
      (candle) => candle.volume
    )
  );

  if (
    firstAverage <= 0 ||
    secondAverage <= 0
  ) {
    return "STABLE";
  }

  const change =
    (secondAverage - firstAverage) /
    firstAverage;

  if (change >= 0.12) {
    return "INCREASING";
  }

  if (change <= -0.12) {
    return "DECREASING";
  }

  return "STABLE";
}

function determinePressure(
  bullishVolume: number,
  bearishVolume: number
): VolumePressure {
  const totalVolume =
    bullishVolume + bearishVolume;

  if (totalVolume <= 0) {
    return "NEUTRAL";
  }

  const bullishShare =
    bullishVolume / totalVolume;

  const bearishShare =
    bearishVolume / totalVolume;

  if (bullishShare >= 0.58) {
    return "BULLISH";
  }

  if (bearishShare >= 0.58) {
    return "BEARISH";
  }

  return "NEUTRAL";
}

function determineConfirmation(
  relativeVolume: number,
  pressure: VolumePressure,
  spike: boolean
): VolumeConfirmation {
  if (
    relativeVolume >= 1.2 &&
    pressure !== "NEUTRAL"
  ) {
    return "CONFIRMED";
  }

  if (
    relativeVolume >= 0.9 ||
    spike
  ) {
    return "WEAK";
  }

  return "NOT_CONFIRMED";
}

function buildExplanation(
  relativeVolume: number,
  trend: VolumeTrend,
  pressure: VolumePressure,
  spike: boolean,
  confirmation: VolumeConfirmation
): AtlasReasonCode[] {
  const relativeCode =
    relativeVolume >= 1.5
      ? "VOLUME_RELATIVE_SIGNIFICANTLY_ABOVE"
      : relativeVolume >= 1.1
        ? "VOLUME_RELATIVE_MODERATELY_ABOVE"
        : relativeVolume >= 0.8
          ? "VOLUME_RELATIVE_CLOSE_TO_AVERAGE"
          : "VOLUME_RELATIVE_BELOW_AVERAGE";

  const trendCode =
    trend === "INCREASING"
      ? "VOLUME_TREND_INCREASING"
      : trend === "DECREASING"
        ? "VOLUME_TREND_DECREASING"
        : "VOLUME_TREND_STABLE";

  const pressureCode =
    pressure === "BULLISH"
      ? "VOLUME_PRESSURE_BUYING_DOMINANT"
      : pressure === "BEARISH"
        ? "VOLUME_PRESSURE_SELLING_DOMINANT"
        : "VOLUME_PRESSURE_BALANCED";

  const spikeCode = spike
    ? "VOLUME_SPIKE_PRESENT"
    : "VOLUME_SPIKE_ABSENT";

  const confirmationCode =
    confirmation === "CONFIRMED"
      ? "VOLUME_CONFIRMATION_CONFIRMED"
      : confirmation === "WEAK"
        ? "VOLUME_CONFIRMATION_WEAK"
        : "VOLUME_CONFIRMATION_NOT_CONFIRMED";

  return [
    { code: relativeCode },
    { code: trendCode },
    { code: pressureCode },
    { code: spikeCode },
    { code: confirmationCode },
  ];
}

export function analyzeVolume(
  candles: AtlasCandle[]
): VolumeAnalysisResult {
  const validCandles = candles.filter(
    (candle) =>
      Number.isFinite(candle.open) &&
      Number.isFinite(candle.close) &&
      Number.isFinite(candle.volume) &&
      candle.volume >= 0
  );

  if (validCandles.length < 20) {
    return {
      latestVolume: 0,
      averageVolume: 0,
      relativeVolume: 0,
      volumeTrend: "STABLE",
      pressure: "NEUTRAL",
      spike: false,
      confirmation: "NOT_CONFIRMED",
      confidence: 0,
      bullishVolume: 0,
      bearishVolume: 0,
      explanation: [
        { code: "VOLUME_INSUFFICIENT_DATA" },
      ],
    };
  }

  const recentCandles =
    validCandles.slice(-20);

  const latestCandle =
    recentCandles.at(-1);

  if (!latestCandle) {
    return {
      latestVolume: 0,
      averageVolume: 0,
      relativeVolume: 0,
      volumeTrend: "STABLE",
      pressure: "NEUTRAL",
      spike: false,
      confirmation: "NOT_CONFIRMED",
      confidence: 0,
      bullishVolume: 0,
      bearishVolume: 0,
      explanation: [
        { code: "VOLUME_NO_RECENT_CANDLE" },
      ],
    };
  }

  const previousCandles =
    recentCandles.slice(0, -1);

  const averageVolume =
    calculateAverage(
      previousCandles.map(
        (candle) => candle.volume
      )
    );

  const latestVolume =
    latestCandle.volume;

  const relativeVolume =
    averageVolume > 0
      ? latestVolume / averageVolume
      : 0;

  let bullishVolume = 0;
  let bearishVolume = 0;

  for (const candle of recentCandles) {
    if (candle.close > candle.open) {
      bullishVolume += candle.volume;
    } else if (
      candle.close < candle.open
    ) {
      bearishVolume += candle.volume;
    }
  }

  const volumeTrend =
    determineVolumeTrend(
      recentCandles
    );

  const pressure =
    determinePressure(
      bullishVolume,
      bearishVolume
    );

  const spike =
    relativeVolume >= 1.5;

  const confirmation =
    determineConfirmation(
      relativeVolume,
      pressure,
      spike
    );

  let confidence = 40;

  if (relativeVolume >= 1.5) {
    confidence += 25;
  } else if (
    relativeVolume >= 1.2
  ) {
    confidence += 15;
  } else if (
    relativeVolume < 0.7
  ) {
    confidence -= 15;
  }

  if (pressure !== "NEUTRAL") {
    confidence += 15;
  }

  if (
    volumeTrend === "INCREASING"
  ) {
    confidence += 10;
  } else if (
    volumeTrend === "DECREASING"
  ) {
    confidence -= 5;
  }

  confidence = clamp(
    Math.round(confidence),
    0,
    100
  );

  return {
    latestVolume,
    averageVolume,
    relativeVolume,
    volumeTrend,
    pressure,
    spike,
    confirmation,
    confidence,
    bullishVolume,
    bearishVolume,
    explanation: buildExplanation(
      relativeVolume,
      volumeTrend,
      pressure,
      spike,
      confirmation
    ),
  };
}