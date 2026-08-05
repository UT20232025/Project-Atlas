export type SessionZone =
  | "LONDON_KILLZONE"
  | "NEW_YORK_KILLZONE"
  | "ASIA"
  | "OFF_HOURS";

export type SessionResult = {
  zone: SessionZone;
  // London/NY killzones are the high-liquidity windows SMC traders favor.
  inKillzone: boolean;
  hourUtc: number;
};

/**
 * Classifies the current UTC hour into a trading session. Killzones use
 * the standard SMC windows (London 07–10 UTC, New York 12–15 UTC) — the
 * high-liquidity periods where setups tend to resolve. Time-based, not
 * candle-based, since it describes *when* a signal is generated.
 */
export function analyzeSession(
  now: Date = new Date()
): SessionResult {
  const hourUtc = now.getUTCHours();

  if (hourUtc >= 7 && hourUtc < 10) {
    return {
      zone: "LONDON_KILLZONE",
      inKillzone: true,
      hourUtc,
    };
  }

  if (hourUtc >= 12 && hourUtc < 15) {
    return {
      zone: "NEW_YORK_KILLZONE",
      inKillzone: true,
      hourUtc,
    };
  }

  if (hourUtc >= 0 && hourUtc < 7) {
    return {
      zone: "ASIA",
      inKillzone: false,
      hourUtc,
    };
  }

  return {
    zone: "OFF_HOURS",
    inKillzone: false,
    hourUtc,
  };
}
