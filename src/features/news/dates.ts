/*
 * News days follow Indian time, whoever is reading: a story published at 1am IST
 * belongs to that day, not the previous day in UTC. Pure functions, used on the
 * server (labels) and in the browser (which day is "today").
 */

export const NEWS_TIME_ZONE = "Asia/Kolkata";

const keyFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: NEWS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "2026-10-22": the calendar day in India when `date` happened. */
export function dayKey(date: Date): string {
  const parts = Object.fromEntries(
    keyFormat.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** The day before a day key: "2026-10-01" → "2026-09-30". */
export function previousDayKey(key: string): string {
  const [year, month, day] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: NEWS_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});
const weekdayFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: NEWS_TIME_ZONE,
  weekday: "long",
});

/** "22 Oct 2026" */
export function formatNewsDate(date: Date): string {
  return dateFormat.format(date);
}

/** "Thursday" */
export function formatWeekday(date: Date): string {
  return weekdayFormat.format(date);
}

/**
 * A day's heading: "Today" or "Yesterday" with the date underneath, otherwise the date with
 * the weekday. Without `todayKey` (while prerendering) every day shows its date.
 */
export function dayHeading(
  day: { key: string; date: string; weekday: string },
  todayKey: string | null,
): { title: string; subtitle: string } {
  if (todayKey && day.key === todayKey) return { title: "Today", subtitle: day.date };
  if (todayKey && day.key === previousDayKey(todayKey)) {
    return { title: "Yesterday", subtitle: day.date };
  }
  return { title: day.date, subtitle: day.weekday };
}
