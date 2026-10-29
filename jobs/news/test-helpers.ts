import { readFileSync } from "node:fs";
import type { Candidate, FetchedItem, Source } from "./types.ts";

/** Fixed clock for tests: 29 Oct 2026, 11:30 in India. */
export const NOW = new Date("2026-10-29T06:00:00Z");

export function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

export function source(overrides: Partial<Source> = {}): Source {
  return {
    id: "source-lab",
    name: "Example Lab",
    kind: "rss",
    url: "https://lab.example.com/blog/rss.xml",
    filterAi: false,
    maxItems: 5,
    active: true,
    consecutiveFailures: 0,
    ...overrides,
  };
}

export function item(overrides: Partial<FetchedItem> = {}): FetchedItem {
  const from = overrides.source ?? source();
  return {
    source: from,
    sourceName: from.name,
    url: "https://lab.example.com/blog/post",
    title: "A new open model from an AI lab",
    snippet: "",
    publishedAt: new Date(NOW.getTime() - 3_600_000),
    ...overrides,
  };
}

export function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    ...item(overrides),
    key: "c1",
    urlHash: "hash-1",
    publishedAt: new Date(NOW.getTime() - 3_600_000),
    ...overrides,
  };
}
