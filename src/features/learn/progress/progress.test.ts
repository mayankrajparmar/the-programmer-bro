import { describe, expect, it } from "vitest";
import { EMPTY_PROGRESS, parseProgress, withQuizResult } from "./progress-store";
import { summarizeProgress } from "./summary";

const at = new Date("2026-10-28T10:00:00Z");

describe("parseProgress", () => {
  it("reads saved progress", () => {
    const saved = JSON.stringify({
      version: 1,
      lessons: { "t/a": { bestScore: 5, total: 6, attempts: 1, completedAt: at.toISOString() } },
    });
    expect(parseProgress(saved).lessons["t/a"]?.bestScore).toBe(5);
  });

  it("falls back to empty progress for missing, broken or old data", () => {
    expect(parseProgress(null)).toBe(EMPTY_PROGRESS);
    expect(parseProgress("{not json")).toBe(EMPTY_PROGRESS);
    expect(parseProgress(JSON.stringify({ version: 0, lessons: {} }))).toBe(EMPTY_PROGRESS);
  });

  it("drops malformed lesson entries but keeps good ones", () => {
    const saved = JSON.stringify({
      version: 1,
      lessons: {
        good: { bestScore: 1, total: 5, attempts: 1, completedAt: "x" },
        bad: { bestScore: "lots" },
      },
    });
    expect(Object.keys(parseProgress(saved).lessons)).toEqual(["good"]);
  });
});

describe("withQuizResult", () => {
  it("records the first attempt", () => {
    const result = withQuizResult(EMPTY_PROGRESS, "t/a", 4, 6, at);
    expect(result.lessons["t/a"]).toEqual({
      bestScore: 4,
      total: 6,
      attempts: 1,
      completedAt: at.toISOString(),
    });
  });

  it("keeps the best score and the first completion time", () => {
    const first = withQuizResult(EMPTY_PROGRESS, "t/a", 5, 6, at);
    const second = withQuizResult(first, "t/a", 3, 6, new Date("2026-11-01T00:00:00Z"));
    expect(second.lessons["t/a"]).toMatchObject({
      bestScore: 5,
      attempts: 2,
      completedAt: at.toISOString(),
    });
  });
});

describe("summarizeProgress", () => {
  const lessons = [
    { key: "t/1", published: true },
    { key: "t/2", published: true },
    { key: "t/3", published: false },
  ];

  it("starts with the first published lesson up next", () => {
    expect(summarizeProgress(EMPTY_PROGRESS, lessons)).toMatchObject({
      doneCount: 0,
      upNext: "t/1",
    });
  });

  it("moves on as lessons are done, and stops at unpublished ones", () => {
    const one = withQuizResult(EMPTY_PROGRESS, "t/1", 5, 6, at);
    expect(summarizeProgress(one, lessons)).toMatchObject({ doneCount: 1, upNext: "t/2" });
    const both = withQuizResult(one, "t/2", 6, 6, at);
    expect(summarizeProgress(both, lessons)).toMatchObject({ doneCount: 2, upNext: null });
  });
});
