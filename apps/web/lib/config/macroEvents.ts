export type MacroEvent = {
  name: string;
  date: string;
  impact: "high";
};

// FOMC meeting announcement dates for 2026 (2:00 PM ET on the second day
// of each two-day meeting), per the Federal Reserve's published schedule
// at federalreserve.gov/monetarypolicy/fomccalendars.htm.
export const MACRO_EVENTS_2026: MacroEvent[] = [
  { name: "FOMC Meeting Announcement", date: "2026-01-28T19:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-03-18T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-04-29T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-06-17T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-07-29T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-09-16T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-10-28T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-12-09T19:00:00Z", impact: "high" },
];
