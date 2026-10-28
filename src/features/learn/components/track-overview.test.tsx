// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_KEY } from "../progress/progress-store";
import { TrackOverview, type TrackModuleView } from "./track-overview";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const lesson = (n: number, published: boolean) => ({
  key: `t/l${n}`,
  number: n,
  title: `Lesson title ${n}`,
  summary: `Summary ${n}`,
  href: `/learn/t/l${n}`,
  published,
  draft: false,
  readingMinutes: published ? 7 : null,
});

const modules: TrackModuleView[] = [
  { id: "A", title: "First", lessons: [lesson(1, true), lesson(2, true)] },
  { id: "B", title: "Second", lessons: [lesson(3, false)] },
];

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("TrackOverview", () => {
  it("invites a first-time visitor to start lesson 1", () => {
    render(<TrackOverview trackTitle="Track" modules={modules} />);
    expect(screen.getByText("0 of 3 lessons done")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Start lesson 1/ }).getAttribute("href")).toBe(
      "/learn/t/l1",
    );
    expect(screen.getByText("We'll save your progress in this browser.")).toBeTruthy();
  });

  it("shows saved progress and continues from the next lesson", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        lessons: { "t/l1": { bestScore: 5, total: 6, attempts: 1, completedAt: "2026-10-28" } },
      }),
    );
    render(<TrackOverview trackTitle="Track" modules={modules} />);
    expect(screen.getByText("1 of 3 lessons done")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Continue: Lesson 2/ })).toBeTruthy();

    const first = screen.getByRole("link", { name: /Lesson title 1/ });
    expect(within(first).getAllByText("Done").length).toBeGreaterThan(0);
    const second = screen.getByRole("link", { name: /Lesson title 2/ });
    expect(within(second).getAllByText("Up next").length).toBeGreaterThan(0);
  });

  it("lists unwritten lessons as coming soon, without a link", () => {
    render(<TrackOverview trackTitle="Track" modules={modules} />);
    expect(screen.queryByRole("link", { name: /Lesson title 3/ })).toBeNull();
    expect(screen.getAllByText("Coming soon").length).toBeGreaterThan(0);
    expect(screen.getByText("1 lesson · coming soon")).toBeTruthy();
  });
});
