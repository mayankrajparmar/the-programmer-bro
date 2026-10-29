// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toNewsView, type NewsItem } from "../view";
import { NewsBrowser, PAGE_SIZE } from "./news-browser";

const NOW = new Date("2026-10-29T06:00:00Z"); // 11:30 in India
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString();

function stories(): NewsItem[] {
  const list: NewsItem[] = [
    { id: "today-1", tag: "models", publishedAt: hoursAgo(1) },
    { id: "today-2", tag: "tools", publishedAt: hoursAgo(2) },
    { id: "yesterday-1", tag: "policy", publishedAt: hoursAgo(26) },
  ].map((item) => ({
    ...item,
    tag: item.tag as NewsItem["tag"],
    title: `Headline for ${item.id}`,
    summary: "A short summary.",
    url: `https://example.com/${item.id}`,
    sourceName: "Example",
  }));
  for (let index = 0; index < PAGE_SIZE; index++) {
    list.push({
      id: `older-${index}`,
      tag: "research",
      title: `Older headline ${index}`,
      summary: "Older summary.",
      url: `https://example.com/older-${index}`,
      sourceName: "Example",
      publishedAt: hoursAgo(72 + index),
    });
  }
  return list;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const renderBrowser = (items = stories()) =>
  render(<NewsBrowser stories={items.map(toNewsView)} />);

describe("NewsBrowser", () => {
  it("groups stories under Today, Yesterday and dated days", () => {
    renderBrowser();
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 3)).toEqual(["Today", "Yesterday", "26 Oct 2026"]);
    expect(screen.getAllByRole("article")).toHaveLength(PAGE_SIZE);
    expect(screen.getByRole("status").textContent).toBe(`Showing ${PAGE_SIZE} of 18 stories`);
  });

  it("links every story to its source in a new tab", () => {
    renderBrowser();
    const link = screen.getByRole("link", { name: /Read source: Headline for today-1/ });
    expect(link.getAttribute("href")).toBe("https://example.com/today-1");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("shows older stories on request", () => {
    renderBrowser();
    fireEvent.click(screen.getByRole("button", { name: "Show older news" }));
    expect(screen.getAllByRole("article")).toHaveLength(18);
    expect(screen.queryByRole("button", { name: "Show older news" })).toBeNull();
  });

  it("filters by topic and keeps today in place when it has nothing on that topic", () => {
    renderBrowser();
    fireEvent.click(screen.getByRole("button", { name: "Policy" }));
    expect(screen.getByRole("button", { name: "Policy" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    const today = screen.getByRole("region", { name: "Today" });
    expect(within(today).getByRole("heading", { name: "No Policy news today." })).toBeTruthy();
    expect(
      screen.getAllByRole("article").map((card) => card.querySelector("h3")?.textContent),
    ).toEqual(["Headline for yesterday-1"]);

    fireEvent.click(within(today).getByRole("button", { name: /See all news/ }));
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("says so when a topic has no stories at all", () => {
    renderBrowser(stories().filter((story) => story.tag !== "india"));
    fireEvent.click(screen.getByRole("button", { name: "India" }));
    expect(screen.getByRole("heading", { name: "No India news yet." })).toBeTruthy();
  });

  it("has a friendly empty state before the first story", () => {
    renderBrowser([]);
    expect(screen.getByRole("heading", { name: "No news yet." })).toBeTruthy();
  });
});
