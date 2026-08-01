export type MacroEvent = {
  name: string;
  date: string;
  impact: "high";
};

// FOMC meeting announcement dates for 2026 (2:00 PM ET on the second day
// of each two-day meeting), per the Federal Reserve's published schedule
// at federalreserve.gov/monetarypolicy/fomccalendars.htm.
const FOMC_EVENTS: MacroEvent[] = [
  { name: "FOMC Meeting Announcement", date: "2026-01-28T19:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-03-18T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-04-29T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-06-17T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-07-29T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-09-16T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-10-28T18:00:00Z", impact: "high" },
  { name: "FOMC Meeting Announcement", date: "2026-12-09T19:00:00Z", impact: "high" },
];

// US CPI (Consumer Price Index) release dates for 2026, 8:30 AM ET,
// per the BLS release schedule (bls.gov/cpi, usinflationcalculator.com).
const CPI_EVENTS: MacroEvent[] = [
  { name: "US CPI Release", date: "2026-01-13T13:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-02-13T13:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-03-11T12:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-04-10T12:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-05-12T12:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-06-10T12:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-07-14T12:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-08-12T12:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-09-11T12:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-10-14T12:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-11-10T13:30:00Z", impact: "high" },
  { name: "US CPI Release", date: "2026-12-10T13:30:00Z", impact: "high" },
];

// US Employment Situation (Non-Farm Payrolls) release dates for 2026,
// 8:30 AM ET, per the BLS release schedule (bls.gov/ces).
const NFP_EVENTS: MacroEvent[] = [
  { name: "US Jobs Report (NFP)", date: "2026-01-09T13:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-02-11T13:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-03-06T13:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-04-03T12:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-05-08T12:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-06-05T12:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-07-02T12:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-08-07T12:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-09-04T12:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-10-02T12:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-11-06T13:30:00Z", impact: "high" },
  { name: "US Jobs Report (NFP)", date: "2026-12-04T13:30:00Z", impact: "high" },
];

export const MACRO_EVENTS_2026: MacroEvent[] = [
  ...FOMC_EVENTS,
  ...CPI_EVENTS,
  ...NFP_EVENTS,
].sort(
  (first, second) =>
    new Date(first.date).getTime() - new Date(second.date).getTime()
);
