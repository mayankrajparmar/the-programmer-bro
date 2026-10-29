import { describe, expect, it } from "vitest";
import { dayHeading, dayKey, formatNewsDate, formatWeekday, previousDayKey } from "./dates";
import { filterByTopic, groupByDay, toNewsView, type NewsItem } from "./view";

const story = (id: string, publishedAt: string, tag: NewsItem["tag"] = "models"): NewsItem => ({
  id,
  title: `Story ${id}`,
  summary: "A summary.",
  tag,
  url: `https://example.com/${id}`,
  sourceName: "Example",
  publishedAt,
});

describe("news dates", () => {
  it("use Indian time to decide the day", () => {
    // 20:00 UTC on the 21st is 01:30 on the 22nd in India.
    expect(dayKey(new Date("2026-10-21T20:00:00Z"))).toBe("2026-10-22");
    expect(dayKey(new Date("2026-10-21T18:00:00Z"))).toBe("2026-10-21");
    expect(formatNewsDate(new Date("2026-10-21T20:00:00Z"))).toBe("22 Oct 2026");
    expect(formatWeekday(new Date("2026-10-21T20:00:00Z"))).toBe("Thursday");
  });

  it("find the previous day across month and year ends", () => {
    expect(previousDayKey("2026-10-01")).toBe("2026-09-30");
    expect(previousDayKey("2027-01-01")).toBe("2026-12-31");
    expect(previousDayKey("2028-03-01")).toBe("2028-02-29");
  });

  it("call the latest days Today and Yesterday once the reader's day is known", () => {
    const day = { key: "2026-10-22", date: "22 Oct 2026", weekday: "Thursday" };
    expect(dayHeading(day, "2026-10-22")).toEqual({ title: "Today", subtitle: "22 Oct 2026" });
    expect(dayHeading(day, "2026-10-23")).toEqual({
      title: "Yesterday",
      subtitle: "22 Oct 2026",
    });
    expect(dayHeading(day, "2026-10-25")).toEqual({ title: "22 Oct 2026", subtitle: "Thursday" });
    expect(dayHeading(day, null)).toEqual({ title: "22 Oct 2026", subtitle: "Thursday" });
  });
});

describe("news views", () => {
  const stories = [
    story("a", "2026-10-22T09:00:00Z", "models"),
    story("b", "2026-10-21T20:00:00Z", "policy"), // still the 22nd in India
    story("c", "2026-10-21T08:00:00Z", "tools"),
  ].map(toNewsView);

  it("group stories by day, newest first", () => {
    const days = groupByDay(stories);
    expect(days.map((day) => [day.key, day.items.map((item) => item.id)])).toEqual([
      ["2026-10-22", ["a", "b"]],
      ["2026-10-21", ["c"]],
    ]);
    expect(days[1]).toMatchObject({ date: "21 Oct 2026", weekday: "Wednesday" });
  });

  it("filter by topic", () => {
    expect(filterByTopic(stories, "policy").map((item) => item.id)).toEqual(["b"]);
    expect(filterByTopic(stories, null)).toHaveLength(3);
  });
});
