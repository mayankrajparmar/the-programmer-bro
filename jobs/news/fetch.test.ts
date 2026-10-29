import { describe, expect, it } from "vitest";
import {
  describeHtml,
  fetchPageDescription,
  fetchSource,
  hnSearchUrl,
  parseFeedItems,
  parseHnItems,
  type Fetcher,
} from "./fetch.ts";
import { fixture, NOW, source } from "./test-helpers.ts";

describe("reading feeds", () => {
  it("reads an RSS feed, skipping items without a link", () => {
    const items = parseFeedItems(fixture("lab-blog.rss.xml"), source());
    expect(items.map((item) => item.title)).toEqual([
      "Introducing Lumen 2, a smaller open model with a longer context window",
      "How we evaluate long-context models",
      "Our year in review",
    ]);
    expect(items[0]).toMatchObject({
      sourceName: "Example Lab",
      url: "https://lab.example.com/blog/lumen-2/?utm_source=rss&utm_medium=feed",
      snippet:
        "Lumen 2 is an open-weights language model that reads prompts of up to 1 million tokens & runs on a single GPU. We are releasing it under the Apache 2.0 licence.",
      publishedAt: new Date("2026-10-29T02:30:00Z"),
    });
  });

  it("reads an Atom feed", () => {
    const items = parseFeedItems(fixture("tech-news.atom.xml"), source({ name: "Tech News" }));
    expect(items).toHaveLength(3);
    expect(items[1]).toMatchObject({
      title: "Government opens consultation on AI rules for public services",
      url: "https://news.example.in/policy/ai-public-services-consultation",
      publishedAt: new Date("2026-10-29T03:00:00Z"),
    });
  });

  it("reads Hacker News, naming each story by its site and skipping posts without a link", () => {
    const items = parseHnItems(JSON.parse(fixture("hn.json")), source({ kind: "hn" }));
    expect(items.map((item) => [item.sourceName, item.title])).toEqual([
      ["github.com", "Show HN: A tiny LLM that runs in the browser"],
      ["retro.example.org", "The history of the floppy disk"],
    ]);
    expect(items[0]?.publishedAt).toEqual(new Date("2026-10-29T03:00:00Z"));
  });

  it("asks Hacker News for the last 48 hours only, keeping the points filter", () => {
    const url = new URL(
      hnSearchUrl(
        "https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=points>=100",
        new Date("2026-10-27T06:00:00Z"),
      ),
    );
    expect(url.searchParams.get("numericFilters")).toBe("points>=100,created_at_i>1793080800");
    expect(url.searchParams.get("tags")).toBe("story");
  });

  it("throws on a bad status so the source counts as failed", async () => {
    const fetcher: Fetcher = async () => new Response("nope", { status: 503 });
    await expect(fetchSource(source(), { fetcher, now: NOW })).rejects.toThrow("HTTP 503");
  });

  it("fetches and parses a source", async () => {
    const seen: string[] = [];
    const fetcher: Fetcher = async (url) => {
      seen.push(url);
      return new Response(fixture("hn.json"));
    };
    const items = await fetchSource(
      source({ kind: "hn", url: "https://hn.algolia.com/api/v1/search_by_date?tags=story" }),
      {
        fetcher,
        now: NOW,
      },
    );
    expect(items).toHaveLength(2);
    expect(seen[0]).toContain("created_at_i%3E");
  });
});

describe("page descriptions", () => {
  it("prefer og:description, then the meta description", () => {
    expect(
      describeHtml(
        `<head><meta name="description" content="Plain"><meta content='Open &amp; graph' property="og:description"></head>`,
      ),
    ).toBe("Open & graph");
    expect(describeHtml(`<meta name="Description" content="Only this">`)).toBe("Only this");
    expect(describeHtml("<p>No meta</p>")).toBe("");
  });

  it("give up quietly on errors and non-HTML pages", async () => {
    const html: Fetcher = async () =>
      new Response(`<meta property="og:description" content="A tiny model.">`, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    const pdf: Fetcher = async () =>
      new Response("%PDF", { headers: { "content-type": "application/pdf" } });
    const broken: Fetcher = async () => {
      throw new Error("offline");
    };
    expect(await fetchPageDescription("https://example.com", html)).toBe("A tiny model.");
    expect(await fetchPageDescription("https://example.com", pdf)).toBe("");
    expect(await fetchPageDescription("https://example.com", broken)).toBe("");
  });
});
