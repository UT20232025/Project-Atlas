import { describe, expect, it } from "vitest";

import { MACRO_EVENTS_2026 } from "@/lib/config/macroEvents";
import {
  applyMacroBlackout,
  readMacroBlackout,
  type MacroBlackoutConfig,
} from "@/lib/atlas/macroBlackout";

const ON: MacroBlackoutConfig = {
  enabled: true,
  hoursBefore: 3,
  hoursAfter: 1,
};

const HOUR = 60 * 60 * 1000;
const eventMs = new Date(MACRO_EVENTS_2026[0].date).getTime();
// Well clear of every 2026 event.
const CLEAR = new Date("2027-06-15T00:00:00Z").getTime();

describe("readMacroBlackout", () => {
  it("is active in the hours before an event", () => {
    expect(readMacroBlackout(ON, eventMs - 2 * HOUR).active).toBe(true);
  });

  it("is active shortly after an event", () => {
    expect(readMacroBlackout(ON, eventMs + 0.5 * HOUR).active).toBe(true);
  });

  it("is inactive outside the window", () => {
    expect(readMacroBlackout(ON, eventMs - 5 * HOUR).active).toBe(false);
    expect(readMacroBlackout(ON, CLEAR).active).toBe(false);
  });

  it("is inactive when disabled", () => {
    expect(
      readMacroBlackout(
        { ...ON, enabled: false },
        eventMs - 2 * HOUR
      ).active
    ).toBe(false);
  });
});

describe("applyMacroBlackout", () => {
  it("downgrades a directional signal during blackout", () => {
    const r = applyMacroBlackout(
      "LONG",
      { active: true, eventName: "FOMC Meeting Announcement" },
      ON
    );
    expect(r.gated).toBe(true);
    expect(r.signal).toBe("WAIT");
    expect(r.reason?.code).toBe("MACRO_BLACKOUT");
    expect(r.reason?.params?.event).toBe("FOMC Meeting Announcement");
  });

  it("passes signals through outside blackout", () => {
    const r = applyMacroBlackout(
      "SHORT",
      { active: false, eventName: null },
      ON
    );
    expect(r.gated).toBe(false);
    expect(r.signal).toBe("SHORT");
  });

  it("never touches an existing WAIT", () => {
    const r = applyMacroBlackout(
      "WAIT",
      { active: true, eventName: "CPI" },
      ON
    );
    expect(r.gated).toBe(false);
  });
});
