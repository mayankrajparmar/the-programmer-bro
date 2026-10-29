// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PROGRESS_KEY } from "../progress/progress-store";
import { ContinueLearningCard, type ContinueLearningView } from "./continue-learning-card";

const lesson = (number: number, published: boolean) => ({
  key: `how-ai-works/lesson-${number}`,
  number,
  title: `Lesson title ${number}`,
  href: `/learn/how-ai-works/lesson-${number}`,
  published,
});

const track = (published: boolean[]): ContinueLearningView => ({
  title: "How AI Works",
  level: "Beginner",
  href: "/learn/how-ai-works",
  moduleCount: 4,
  lessons: published.map((out, index) => lesson(index + 1, out)),
});

function finish(...numbers: number[]) {
  const lessons = Object.fromEntries(
    numbers.map((number) => [
      `how-ai-works/lesson-${number}`,
      { bestScore: 5, total: 6, attempts: 1, completedAt: "2026-10-28T10:00:00.000Z" },
    ]),
  );
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, lessons }));
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ContinueLearningCard", () => {
  it("starts a first visit at the first lesson", () => {
    render(<ContinueLearningCard track={track([true, true, false])} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Start here");
    expect(
      screen.getByRole("link", { name: "Start lesson 1: Lesson title 1" }).getAttribute("href"),
    ).toBe("/learn/how-ai-works/lesson-1");
    expect(screen.getByText("0 of 3 lessons done")).toBeTruthy();
    expect(screen.getByText("We'll save your progress in this browser.")).toBeTruthy();
  });

  it("sends a returning learner to the next lesson", () => {
    finish(1);
    render(<ContinueLearningCard track={track([true, true, false])} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Continue learning");
    expect(
      screen
        .getByRole("link", { name: "Continue: Lesson 2 · Lesson title 2" })
        .getAttribute("href"),
    ).toBe("/learn/how-ai-works/lesson-2");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
  });

  it("says you're up to date when every published lesson is done", () => {
    finish(1, 2);
    render(<ContinueLearningCard track={track([true, true, false])} />);
    expect(screen.getByRole("link", { name: "Review the track" }).getAttribute("href")).toBe(
      "/learn/how-ai-works",
    );
    expect(screen.getByText(/You're up to date/)).toBeTruthy();
  });

  it("points to the lesson plan before any lesson is out", () => {
    render(<ContinueLearningCard track={track([false, false])} />);
    expect(screen.getByRole("link", { name: "See the lesson plan" })).toBeTruthy();
    expect(screen.getByText(/being checked/)).toBeTruthy();
  });
});
