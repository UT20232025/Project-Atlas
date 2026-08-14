import type { AtlasMtfResult } from "@/lib/atlas/multiTimeframeEngine";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import type { AtlasTradeDirection } from "@/lib/atlas/riskEngine";

// The regime gate refuses to fight the higher-timeframe trend. The track
// record showed directional signals only work with the prevailing regime:
// LONGs win 57-100% in up-weeks but 0-36% in down-weeks (and vice-versa for
// SHORTs), while chop weeks lose both ways. So we block counter-trend calls
// and stand aside in chop — turning a marginal signal into WAIT rather than
// a coin-flip trade.

export type RegimeGateConfig = {
  enabled: boolean;
  // Minimum higher-timeframe trend strength (0-100) required to treat the
  // market as trending. Below this, the regime reads as chop → WAIT.
  minRegimeStrength: number;
};

export function getRegimeGateConfig(): RegimeGateConfig {
  const enabled = process.env.ATLAS_REGIME_GATE !== "off";

  const raw = Number(process.env.ATLAS_REGIME_MIN_STRENGTH);
  const minRegimeStrength = Number.isFinite(raw) ? raw : 60;

  return { enabled, minRegimeStrength };
}

export type RegimeDirection = "BULLISH" | "BEARISH" | "NEUTRAL";

export type RegimeRead = {
  direction: RegimeDirection;
  strength: number;
};

const TIMEFRAME_RANK: Record<string, number> = {
  "15m": 1,
  "1h": 2,
  "4h": 3,
  "1d": 4,
};

/**
 * Reads the prevailing regime from the highest available timeframe in the
 * multi-timeframe result (4h today) — the closest thing the engine has to a
 * "which way is the market really going" anchor.
 */
export function readRegime(mtf: AtlasMtfResult): RegimeRead {
  const anchor = [...mtf.timeframeResults].sort(
    (a, b) =>
      (TIMEFRAME_RANK[b.timeframe] ?? 0) -
      (TIMEFRAME_RANK[a.timeframe] ?? 0)
  )[0];

  if (!anchor) {
    return { direction: "NEUTRAL", strength: 0 };
  }

  const direction: RegimeDirection =
    anchor.trendDirection === "STRONG_BULLISH" ||
    anchor.trendDirection === "BULLISH"
      ? "BULLISH"
      : anchor.trendDirection === "STRONG_BEARISH" ||
          anchor.trendDirection === "BEARISH"
        ? "BEARISH"
        : "NEUTRAL";

  return { direction, strength: anchor.trendStrength };
}

export type RegimeGateResult = {
  // The signal after gating — may be downgraded to WAIT.
  signal: AtlasTradeDirection;
  gated: boolean;
  // Why it was gated, for the decision explanation / warnings.
  reason: AtlasReasonCode | null;
};

export function applyRegimeGate(
  signal: AtlasTradeDirection,
  regime: RegimeRead,
  config: RegimeGateConfig
): RegimeGateResult {
  if (!config.enabled || signal === "WAIT") {
    return { signal, gated: false, reason: null };
  }

  // Chop: no clear higher-timeframe trend → don't trade either side.
  if (
    regime.direction === "NEUTRAL" ||
    regime.strength < config.minRegimeStrength
  ) {
    return {
      signal: "WAIT",
      gated: true,
      reason: { code: "REGIME_GATE_CHOP" },
    };
  }

  // Counter-trend: never fight the higher-timeframe regime.
  if (signal === "LONG" && regime.direction === "BEARISH") {
    return {
      signal: "WAIT",
      gated: true,
      reason: { code: "REGIME_GATE_COUNTER_TREND_LONG" },
    };
  }

  if (signal === "SHORT" && regime.direction === "BULLISH") {
    return {
      signal: "WAIT",
      gated: true,
      reason: { code: "REGIME_GATE_COUNTER_TREND_SHORT" },
    };
  }

  return { signal, gated: false, reason: null };
}
