import { MACRO_EVENTS_2026 } from "@/lib/config/macroEvents";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import type { AtlasTradeDirection } from "@/lib/atlas/riskEngine";

// High-impact macro events (FOMC, CPI, NFP) whipsaw price unpredictably —
// setups that were clean get run over by the news spike, not by anything in
// the chart. So we stand aside in a window around each event: a directional
// signal is downgraded to WAIT until the dust settles.

export type MacroBlackoutConfig = {
  enabled: boolean;
  hoursBefore: number;
  hoursAfter: number;
};

export function getMacroBlackoutConfig(): MacroBlackoutConfig {
  const enabled = process.env.ATLAS_MACRO_BLACKOUT !== "off";

  const before = Number(process.env.ATLAS_MACRO_HOURS_BEFORE);
  const after = Number(process.env.ATLAS_MACRO_HOURS_AFTER);

  return {
    enabled,
    hoursBefore: Number.isFinite(before) ? before : 3,
    hoursAfter: Number.isFinite(after) ? after : 1,
  };
}

export type MacroBlackoutRead = {
  active: boolean;
  eventName: string | null;
};

const HOUR_MS = 60 * 60 * 1000;

export function readMacroBlackout(
  config: MacroBlackoutConfig,
  now: number = Date.now()
): MacroBlackoutRead {
  if (!config.enabled) {
    return { active: false, eventName: null };
  }

  for (const event of MACRO_EVENTS_2026) {
    if (event.impact !== "high") continue;

    const eventMs = new Date(event.date).getTime();
    if (!Number.isFinite(eventMs)) continue;

    const windowStart = eventMs - config.hoursBefore * HOUR_MS;
    const windowEnd = eventMs + config.hoursAfter * HOUR_MS;

    if (now >= windowStart && now <= windowEnd) {
      return { active: true, eventName: event.name };
    }
  }

  return { active: false, eventName: null };
}

export type MacroBlackoutResult = {
  signal: AtlasTradeDirection;
  gated: boolean;
  reason: AtlasReasonCode | null;
};

export function applyMacroBlackout(
  signal: AtlasTradeDirection,
  read: MacroBlackoutRead,
  config: MacroBlackoutConfig
): MacroBlackoutResult {
  if (!config.enabled || !read.active || signal === "WAIT") {
    return { signal, gated: false, reason: null };
  }

  return {
    signal: "WAIT",
    gated: true,
    reason: {
      code: "MACRO_BLACKOUT",
      params: { event: read.eventName ?? "" },
    },
  };
}
