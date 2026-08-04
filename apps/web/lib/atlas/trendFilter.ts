import type {
  AtlasRisk,
  AtlasSignal,
} from "@/lib/atlas/atlasEngine";
import type { AtlasTrendStatus } from "@/lib/atlas/atlasIndicators";

export type AtlasTrendFilterInput = {
  signal: AtlasSignal;
  confidence: number;
  risk: AtlasRisk;
  trendStatus: AtlasTrendStatus;
};

export type AtlasTrendFilterResult = {
  signal: AtlasSignal;
  confidence: number;
  risk: AtlasRisk;
  allowed: boolean;
};

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

function isLongSignal(signal: AtlasSignal): boolean {
  return (
    signal === "LONG" ||
    signal === "STRONG_LONG"
  );
}

function isShortSignal(signal: AtlasSignal): boolean {
  return (
    signal === "SHORT" ||
    signal === "STRONG_SHORT"
  );
}

function strengthenLongSignal(
  signal: AtlasSignal
): AtlasSignal {
  if (signal === "LONG") {
    return "STRONG_LONG";
  }

  return signal;
}

function strengthenShortSignal(
  signal: AtlasSignal
): AtlasSignal {
  if (signal === "SHORT") {
    return "STRONG_SHORT";
  }

  return signal;
}

function weakenSignal(
  signal: AtlasSignal
): AtlasSignal {
  if (
    signal === "STRONG_LONG" ||
    signal === "STRONG_SHORT"
  ) {
    return signal === "STRONG_LONG"
      ? "LONG"
      : "SHORT";
  }

  if (
    signal === "LONG" ||
    signal === "SHORT"
  ) {
    return "NEUTRAL";
  }

  return signal;
}

export function applyTrendFilter({
  signal,
  confidence,
  risk,
  trendStatus,
}: AtlasTrendFilterInput): AtlasTrendFilterResult {
  const longSignal = isLongSignal(signal);
  const shortSignal = isShortSignal(signal);

  if (signal === "NEUTRAL") {
    return {
      signal,
      confidence,
      risk: "HIGH",
      allowed: false,
    };
  }

  if (trendStatus === "STRONG_BULLISH") {
    if (longSignal) {
      return {
        signal: strengthenLongSignal(signal),
        confidence: clamp(
          confidence + 8,
          50,
          100
        ),
        risk: "LOW",
        allowed: true,
      };
    }

    return {
      signal: "NEUTRAL",
      confidence: clamp(
        confidence - 20,
        50,
        100
      ),
      risk: "HIGH",
      allowed: false,
    };
  }

  if (trendStatus === "BULLISH") {
    if (longSignal) {
      return {
        signal,
        confidence: clamp(
          confidence + 4,
          50,
          100
        ),
        risk:
          risk === "HIGH"
            ? "MODERATE"
            : risk,
        allowed: true,
      };
    }

    return {
      signal: weakenSignal(signal),
      confidence: clamp(
        confidence - 12,
        50,
        100
      ),
      risk: "HIGH",
      allowed: false,
    };
  }

  if (trendStatus === "STRONG_BEARISH") {
    if (shortSignal) {
      return {
        signal: strengthenShortSignal(signal),
        confidence: clamp(
          confidence + 8,
          50,
          100
        ),
        risk: "LOW",
        allowed: true,
      };
    }

    return {
      signal: "NEUTRAL",
      confidence: clamp(
        confidence - 20,
        50,
        100
      ),
      risk: "HIGH",
      allowed: false,
    };
  }

  if (trendStatus === "BEARISH") {
    if (shortSignal) {
      return {
        signal,
        confidence: clamp(
          confidence + 4,
          50,
          100
        ),
        risk:
          risk === "HIGH"
            ? "MODERATE"
            : risk,
        allowed: true,
      };
    }

    return {
      signal: weakenSignal(signal),
      confidence: clamp(
        confidence - 12,
        50,
        100
      ),
      risk: "HIGH",
      allowed: false,
    };
  }

  return {
    signal: weakenSignal(signal),
    confidence: clamp(
      confidence - 8,
      50,
      100
    ),
    risk: "HIGH",
    allowed: false,
  };
}