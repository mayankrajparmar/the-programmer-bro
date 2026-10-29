import { dayKey, formatNewsDate, formatWeekday } from "./dates";
import type { NewsTopic } from "./topics";

/** An approved story. */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  tag: NewsTopic;
  url: string;
  sourceName: string;
  /** ISO timestamp of when the source published it. */
  publishedAt: string;
}

/**
 * A story ready to show. Dates are formatted on the server, so the browser's own date
 * formatting can't disagree with the prerendered HTML.
 */
export interface NewsView extends NewsItem {
  /** "2026-10-22", the day in India. */
  day: string;
  /** "22 Oct 2026" */
  date: string;
  /** "Thursday" */
  weekday: string;
}

export interface NewsDay {
  key: string;
  date: string;
  weekday: string;
  items: NewsView[];
}

export function toNewsView(item: NewsItem): NewsView {
  const published = new Date(item.publishedAt);
  return {
    ...item,
    day: dayKey(published),
    date: formatNewsDate(published),
    weekday: formatWeekday(published),
  };
}

/** Consecutive stories from the same day, in the order given (newest first). */
export function groupByDay(items: NewsView[]): NewsDay[] {
  const days: NewsDay[] = [];
  for (const item of items) {
    const last = days.at(-1);
    if (last?.key === item.day) {
      last.items.push(item);
    } else {
      days.push({ key: item.day, date: item.date, weekday: item.weekday, items: [item] });
    }
  }
  return days;
}

export function filterByTopic<T extends { tag: NewsTopic }>(items: T[], topic: NewsTopic | null) {
  return topic ? items.filter((item) => item.tag === topic) : items;
}
