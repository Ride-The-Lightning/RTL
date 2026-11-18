// Issue #1331. Moments that the monthly reports booked to the wrong day, or to a day past the end of the
// month, when the month had a daylight-saving change before them. They are built in the local timezone,
// so each is the stated wall-clock time wherever the specs run; the specs only tell the old arithmetic
// from the calendar in a timezone that has daylight saving (Europe for October, the US for November).
export const DST_REPORT_CASES = [
  { label: 'the last hour of October', at: new Date(2025, 9, 31, 23, 30, 0), day: 31 },
  { label: 'the last hour of November', at: new Date(2025, 10, 30, 23, 30, 0), day: 30 },
  { label: 'the first hour of 31 March', at: new Date(2025, 2, 31, 0, 30, 0), day: 31 }
];

// The days of the report (1-based) that hold at least one entry, read with the given accessor.
export const daysWithEntries = (report: any[], count: (day: any) => number) => report.filter((day) => count(day) > 0).map((day) => +day.name);
