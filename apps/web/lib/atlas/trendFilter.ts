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
  explanation: string;
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
      explanation:
        "Atlas has no clear directional signal, so the EMA trend filter does not approve a trade.",
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
        explanation:
          "EMA20, EMA50 and EMA200 confirm a strong bullish trend. The LONG signal is approved and strengthened.",
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
      explanation:
        "The SHORT signal conflicts with a strong bullish EMA trend and has been rejected.",
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
        explanation:
          "The EMA trend is bullish and supports the LONG signal.",
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
      explanation:
        "The SHORT signal conflicts with the bullish EMA trend and has been weakened.",
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
        explanation:
          "EMA20, EMA50 and EMA200 confirm a strong bearish trend. The SHORT signal is approved and strengthened.",
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
      explanation:
        "The LONG signal conflicts with a strong bearish EMA trend and has been rejected.",
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
        explanation:
          "The EMA trend is bearish and supports the SHORT signal.",
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
      explanation:
        "The LONG signal conflicts with the bearish EMA trend and has been weakened.",
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
    explanation:
      "The EMA structure is sideways. Atlas requires stronger confirmation before approving a trade.",
  };
}