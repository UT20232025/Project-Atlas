import { MACRO_EVENTS_2026 } from "@/lib/config/macroEvents";

export type UpcomingMacroEvent = {
  name: string;
  date: string;
  impact: "high";
  hoursUntil: number;
};

const DEFAULT_EVENT_COUNT = 3;

export function getUpcomingMacroEvents(
  count = DEFAULT_EVENT_COUNT,
  now = Date.now()
): UpcomingMacroEvent[] {
  return MACRO_EVENTS_2026.map((event) => {
    const eventMs = new Date(event.date).getTime();

    return {
      name: event.name,
      date: event.date,
      impact: event.impact,
      hoursUntil: Math.round(
        (eventMs - now) / (60 * 60 * 1000)
      ),
    };
  })
    .filter((event) => event.hoursUntil >= 0)
    .sort((first, second) => first.hoursUntil - second.hoursUntil)
    .slice(0, count);
}
