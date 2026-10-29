import { describe, expect, it } from "vitest";
import { capRun, dedupe, emptyStats, prefilter, type Prepared } from "./select.ts";
import { item, NOW, source } from "./test-helpers.ts";

const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000);

describe("prefilter", () => {
  it("drops old stories, off-topic stories from general feeds and bad links", () => {
    const general = source({ id: "s2", name: "General Tech", filterAi: true });
    const stats = emptyStats();
    const kept = prefilter(
      [
        item({ url: "https://lab.example.com/a", publishedAt: hoursAgo(2) }),
        item({ url: "https://lab.example.com/old", publishedAt: hoursAgo(60) }),
        item({ url: "ftp://lab.example.com/file", publishedAt: hoursAgo(1) }),
        item({
          source: general,
          title: "New phone has a bigger battery",
          url: "https://t.example/p",
        }),
        item({
          source: general,
          title: "Startup launches an AI tutor",
          url: "https://t.example/ai",
        }),
      ],
      NOW,
      stats,
    );
    expect(kept.map((story) => story.url)).toEqual([
      "https://lab.example.com/a",
      "https://t.example/ai",
    ]);
    expect(stats).toMatchObject({ tooOld: 1, notAboutAi: 1, badLink: 1 });
  });

  it("keeps each source's newest stories up to its limit, dating undated ones now", () => {
    const busy = source({ maxItems: 2 });
    const stats = emptyStats();
    const kept = prefilter(
      [
        item({ source: busy, url: "https://lab.example.com/1", publishedAt: hoursAgo(5) }),
        item({ source: busy, url: "https://lab.example.com/2", publishedAt: null }),
        item({ source: busy, url: "https://lab.example.com/3", publishedAt: hoursAgo(1) }),
      ],
      NOW,
      stats,
    );
    expect(kept.map((story) => story.url)).toEqual([
      "https://lab.example.com/2",
      "https://lab.example.com/3",
    ]);
    expect(kept[0]?.publishedAt).toEqual(NOW);
    expect(stats.overSourceLimit).toBe(1);
  });
});

function prepared(name: string, title: string, hash: string, hours = 1): Prepared {
  const from = source({ id: name, name });
  return {
    ...item({ source: from, title, url: `https://${name}.example/${hash}` }),
    urlHash: hash,
    publishedAt: hoursAgo(hours),
  };
}

describe("dedupe", () => {
  it("drops saved links, repeated links and the same story from another outlet", () => {
    const stats = emptyStats();
    const kept = dedupe(
      [
        prepared(
          "outlet",
          "Lumen 2: lab releases smaller open model with longer context window",
          "h2",
        ),
        prepared(
          "lab",
          "Introducing Lumen 2, a smaller open model with a longer context window",
          "h1",
        ),
        prepared("lab", "Introducing Lumen 2 again", "h1"),
        prepared("lab", "Something we already saved", "h0"),
        prepared("outlet", "Agencies told to label AI-generated content", "h3"),
        prepared("outlet", "Rules on labelling AI content take effect", "h4"),
      ],
      {
        knownHashes: new Set(["h0"]),
        recentTitles: ["Agencies told to label AI generated content"],
        sourceOrder: ["lab", "outlet"],
      },
      stats,
    );
    // The lab's own post wins over the outlet's report of it.
    expect(kept.map((story) => story.urlHash)).toEqual(["h1", "h4"]);
    expect(stats).toMatchObject({ seenBefore: 2, sameStory: 2 });
  });
});

describe("capRun", () => {
  it("takes stories in turns from each source and numbers them", () => {
    const stats = emptyStats();
    const picked = capRun(
      [
        prepared("a", "A one", "a1", 1),
        prepared("a", "A two", "a2", 2),
        prepared("a", "A three", "a3", 3),
        prepared("b", "B one", "b1", 4),
      ],
      3,
      ["a", "b"],
      stats,
    );
    expect(picked.map((story) => [story.key, story.urlHash])).toEqual([
      ["c1", "a1"],
      ["c2", "b1"],
      ["c3", "a2"],
    ]);
    expect(stats.overRunLimit).toBe(1);
  });
});
