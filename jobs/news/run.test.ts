import { describe, expect, it } from "vitest";
import type { Fetcher } from "./fetch.ts";
import { formatReport } from "./report.ts";
import { runIngest } from "./run.ts";
import { loadSources, parseSources } from "./sources.ts";
import type { NewsStore, RunTotals } from "./store.ts";
import type { Summarizer, SummaryInput } from "./summarize.ts";
import { fixture, NOW } from "./test-helpers.ts";
import type { NewsItemRow, SourceConfig } from "./types.ts";

const configs: SourceConfig[] = [
  {
    name: "Example Lab",
    kind: "rss",
    url: "https://lab.example.com/rss.xml",
    filterAi: false,
    maxItems: 5,
  },
  {
    name: "Example News",
    kind: "rss",
    url: "https://news.example.in/atom.xml",
    defaultTag: "india",
    filterAi: true,
    maxItems: 5,
  },
  {
    name: "Hacker News",
    kind: "hn",
    url: "https://hn.algolia.com/api/v1/search_by_date?tags=story",
    filterAi: true,
    maxItems: 5,
  },
];

const pages: Record<string, () => Response> = {
  "https://lab.example.com/rss.xml": () => new Response(fixture("lab-blog.rss.xml")),
  "https://news.example.in/atom.xml": () => new Response(fixture("tech-news.atom.xml")),
  "https://hn.algolia.com/api/v1/search_by_date": () => new Response(fixture("hn.json")),
  "https://github.com/example/tiny-llm": () =>
    new Response(
      `<meta property="og:description" content="A 50 MB language model that runs in your browser with WebGPU.">`,
      {
        headers: { "content-type": "text/html" },
      },
    ),
};

const fetcher: Fetcher = async (url) => {
  const page = pages[url.split("?")[0]!.replace(/\/$/, "")] ?? pages[url.split("?")[0]!];
  return page ? page() : new Response("not found", { status: 404 });
};

function memoryStore(saved: NewsItemRow[] = []) {
  const runs: RunTotals[] = [];
  const fetches: { name: string; ok: boolean }[] = [];
  const store: NewsStore = {
    async syncSources(list) {
      return list.map((config, index) => ({
        ...config,
        id: `source-${index}`,
        active: true,
        consecutiveFailures: 0,
      }));
    },
    async recordFetch(source, result) {
      fetches.push({ name: source.name, ok: result.ok });
    },
    async knownHashes(hashes) {
      return new Set(saved.map((row) => row.url_hash).filter((hash) => hashes.includes(hash)));
    },
    async recentTitles() {
      return saved.map((row) => row.source_title);
    },
    async saveItems(rows) {
      saved.push(...rows);
      return rows.length;
    },
    async startRun() {
      return "run-1";
    },
    async finishRun(_id, totals) {
      runs.push(totals);
    },
  };
  return { store, saved, runs, fetches };
}

/** Writes a fine summary for everything, and skips the floppy-disk story as not about AI. */
const summarizer: Summarizer = {
  name: "Fake",
  async summarize(items: SummaryInput[]) {
    return JSON.stringify({
      items: items.map((entry) => ({
        id: entry.id,
        headline: `Plain headline for ${entry.source}`,
        summary:
          "Something new happened in AI today, explained here in plain words. It matters because learners can try it and see how these systems behave in practice.",
        tag: entry.title.includes("floppy") ? "skip" : "tools",
      })),
    });
  },
};

const options = { dryRun: false, maxItems: 20 };
const now = () => NOW;
const sleep = async () => {};

describe("runIngest", () => {
  it("fetches, filters, removes duplicates, summarises and saves drafts", async () => {
    const db = memoryStore();
    const report = await runIngest(
      { configs, store: db.store, summarizer, fetcher, now, sleep },
      options,
    );

    expect(report.status).toBe("ok");
    expect(report.fetched).toBe(8); // 3 lab posts with links, 3 news entries, 2 HN links
    expect(report.stats).toMatchObject({ tooOld: 1, notAboutAi: 2, sameStory: 1 });
    expect(db.saved.map((row) => [row.source_name, row.source_title, row.status])).toEqual([
      [
        "Example Lab",
        "Introducing Lumen 2, a smaller open model with a longer context window",
        "draft",
      ],
      ["Example News", "Government opens consultation on AI rules for public services", "draft"],
      ["github.com", "Show HN: A tiny LLM that runs in the browser", "draft"],
      ["Example Lab", "How we evaluate long-context models", "draft"],
    ]);
    expect(db.saved[0]).toMatchObject({
      source_id: "source-0",
      url: "https://lab.example.com/blog/lumen-2",
      title: "Plain headline for Example Lab",
      tag: "tools",
    });
    expect(db.runs).toEqual([{ status: "ok", fetched: 8, fresh: 4, saved: 4, errors: [] }]);
    expect(db.fetches.every((fetch) => fetch.ok)).toBe(true);
  });

  it("saves stories the summariser marks as not about AI as rejected", async () => {
    const db = memoryStore();
    const general = configs.map((config) => ({ ...config, filterAi: false }));
    await runIngest(
      { configs: general, store: db.store, summarizer, fetcher, now, sleep },
      options,
    );
    const floppy = db.saved.find((row) => row.source_title.includes("floppy"));
    expect(floppy).toMatchObject({ status: "rejected", tag: null, summary: null });
  });

  it("finds nothing new the second time round", async () => {
    const db = memoryStore();
    await runIngest({ configs, store: db.store, summarizer, fetcher, now, sleep }, options);
    const second = await runIngest(
      { configs, store: db.store, summarizer, fetcher, now, sleep },
      options,
    );
    expect(second.saved).toBe(0);
    expect(second.stats.seenBefore).toBe(4);
  });

  it("carries on when a source fails, and reports a partial run", async () => {
    const db = memoryStore();
    const broken = [
      ...configs,
      { ...configs[0]!, name: "Broken", url: "https://broken.example/rss" },
    ];
    const report = await runIngest(
      { configs: broken, store: db.store, summarizer, fetcher, now, sleep },
      options,
    );
    expect(report.status).toBe("partial");
    expect(report.errors).toEqual([{ source: "Broken", stage: "fetch", message: "HTTP 404" }]);
    expect(db.fetches).toContainEqual({ name: "Broken", ok: false });
    expect(db.saved).toHaveLength(4);
  });

  it("fails when every source fails, so GitHub sends an email", async () => {
    const db = memoryStore();
    const report = await runIngest(
      {
        configs,
        store: db.store,
        summarizer,
        fetcher: async () => new Response("", { status: 500 }),
        now,
        sleep,
      },
      options,
    );
    expect(report.status).toBe("failed");
    expect(db.runs[0]?.status).toBe("failed");
  });

  it("fails and saves nothing when the summariser is down, so the next run retries", async () => {
    const db = memoryStore();
    const down: Summarizer = {
      name: "Down",
      async summarize() {
        throw new Error("service unavailable");
      },
    };
    const report = await runIngest(
      { configs, store: db.store, summarizer: down, fetcher, now, sleep },
      options,
    );
    expect(report.status).toBe("failed");
    expect(report.deferred).toBe(4);
    expect(db.saved).toEqual([]);
  });

  it("keeps to the per-run cap", async () => {
    const db = memoryStore();
    const report = await runIngest(
      { configs, store: db.store, summarizer, fetcher, now, sleep },
      { ...options, maxItems: 2 },
    );
    expect(report.saved).toBe(2);
    expect(report.stats.overRunLimit).toBe(2);
  });

  it("prints a readable report", async () => {
    const db = memoryStore();
    const report = await runIngest(
      { configs, store: db.store, summarizer: null, fetcher, now, sleep },
      { ...options, dryRun: true },
    );
    const text = formatReport(
      report,
      configs.map((config) => config.name),
    );
    expect(text).toContain("Status: ok (dry run: nothing was saved)");
    expect(text).toContain("Example Lab              3 stories");
    expect(text).toContain(
      "Would save 4 stories: 4 drafts, 0 rejected as not about AI, 4 without a summary.",
    );
  });
});

describe("content/news-sources.json", () => {
  it("is valid", () => {
    const sources = loadSources();
    expect(sources.length).toBeGreaterThan(5);
    expect(sources.every((source) => source.url.startsWith("https://"))).toBe(true);
  });

  it("rejects repeated sources and unknown fields", () => {
    const one = { name: "A", kind: "rss", url: "https://a.example/rss" };
    expect(() => parseSources({ sources: [one, one] })).toThrow(/used twice/);
    expect(() => parseSources({ sources: [{ ...one, colour: "red" }] })).toThrow();
    expect(() => parseSources({ sources: [{ ...one, url: "http://a.example/rss" }] })).toThrow();
  });
});
