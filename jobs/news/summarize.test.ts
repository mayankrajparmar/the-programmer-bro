import { describe, expect, it, vi } from "vitest";
import {
  parseSummaries,
  RESPONSE_SCHEMA,
  summariseAll,
  SummarizerError,
  type Summarizer,
  type SummaryInput,
} from "./summarize.ts";
import { NEWS_TOPICS } from "../../src/features/news/topics.ts";
import { candidate } from "./test-helpers.ts";

const input: SummaryInput = {
  id: "c1",
  title: "Introducing Lumen 2, a smaller open model with a longer context window",
  source: "Example Lab",
  snippet:
    "Lumen 2 is an open-weights language model that reads prompts of up to 1 million tokens and runs on a single GPU.",
};

const good = {
  id: "c1",
  headline: "An open model that reads very long prompts on one GPU",
  summary:
    "An AI lab has released Lumen 2, an open model that can take in very long prompts and still runs on a single graphics card. That makes it easier to summarise long documents on your own machine.",
  tag: "models",
};

const reply = (...items: object[]) => JSON.stringify({ items });

describe("parseSummaries", () => {
  it("accepts a good entry and tidies stray quotes", () => {
    const { valid, invalid } = parseSummaries(reply({ ...good, headline: `"${good.headline}"` }), [
      input,
    ]);
    expect(invalid.size).toBe(0);
    expect(valid.get("c1")).toEqual({
      headline: good.headline,
      summary: good.summary,
      tag: "models",
    });
  });

  it("keeps the source's title for stories that aren't about AI", () => {
    const { valid } = parseSummaries(reply({ ...good, tag: "skip", summary: "" }), [input]);
    expect(valid.get("c1")).toEqual({ headline: input.title, summary: "", tag: "skip" });
  });

  it("rejects copied text, unknown tags, wrong lengths, missing entries and bad JSON", () => {
    const copy = {
      ...good,
      summary:
        "Lumen 2 is an open-weights language model that reads prompts of up to 1 million tokens. Useful for long documents.",
    };
    expect(parseSummaries(reply(copy), [input]).invalid.get("c1")).toBe(
      "summary copies the source",
    );
    expect(parseSummaries(reply({ ...good, tag: "gossip" }), [input]).invalid.get("c1")).toMatch(
      /unknown tag/,
    );
    expect(
      parseSummaries(reply({ ...good, summary: "Too short." }), [input]).invalid.get("c1"),
    ).toMatch(/summary has 2 words/);
    expect(parseSummaries(reply(), [input]).invalid.get("c1")).toBe("missing from the reply");
    expect(parseSummaries("not json", [input]).invalid.get("c1")).toBe("reply wasn't valid JSON");
  });

  it("ignores entries for ids it didn't ask about", () => {
    const { valid } = parseSummaries(reply({ ...good, id: "c9" }, good), [input]);
    expect([...valid.keys()]).toEqual(["c1"]);
  });
});

describe("the reply schema", () => {
  it("offers exactly the site's topics plus skip", () => {
    expect(RESPONSE_SCHEMA.properties.items.items.properties.tag.enum).toEqual([
      ...NEWS_TOPICS,
      "skip",
    ]);
  });
});

function fakeSummarizer(replies: (string | Error)[]): Summarizer & { calls: SummaryInput[][] } {
  const calls: SummaryInput[][] = [];
  return {
    name: "Fake",
    calls,
    async summarize(items) {
      calls.push(items);
      const next = replies.shift();
      if (next === undefined) throw new Error("no more replies");
      if (next instanceof Error) throw next;
      return next;
    },
  };
}

const sleep = vi.fn(async () => {});
const stories = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    candidate({ key: `c${index + 1}`, title: `Story number ${index + 1} about an AI model` }),
  );
const goodFor = (id: string) => ({ ...good, id });

describe("summariseAll", () => {
  it("sends batches and retries only the entries that failed the checks", async () => {
    const summarizer = fakeSummarizer([
      reply(goodFor("c1"), { ...goodFor("c2"), tag: "gossip" }),
      reply(goodFor("c2")),
    ]);
    const result = await summariseAll(stories(2), summarizer, { sleep });
    expect(summarizer.calls.map((call) => call.map((entry) => entry.id))).toEqual([
      ["c1", "c2"],
      ["c2"],
    ]);
    expect(result.summaries.get("c2")?.tag).toBe("models");
    expect(result.errors).toEqual([]);
  });

  it("saves entries that fail twice without a summary, and says so", async () => {
    const summarizer = fakeSummarizer([reply(goodFor("c1")), reply()]);
    const result = await summariseAll(stories(2), summarizer, { sleep });
    expect(result.summaries.get("c2")).toBeNull();
    expect(result.errors[0]?.message).toMatch(/1 summary failed the checks twice/);
  });

  it("splits work into batches of ten", async () => {
    const summarizer = fakeSummarizer([
      reply(...Array.from({ length: 10 }, (_, i) => goodFor(`c${i + 1}`))),
      reply(goodFor("c11")),
    ]);
    const result = await summariseAll(stories(11), summarizer, { sleep });
    expect(summarizer.calls.map((call) => call.length)).toEqual([10, 1]);
    expect(result.summaries.size).toBe(11);
  });

  it("retries a failed request once, then stops and leaves the rest for the next run", async () => {
    const summarizer = fakeSummarizer([
      new SummarizerError("HTTP 503", { retry: true }),
      new SummarizerError("HTTP 503", { retry: true }),
    ]);
    const result = await summariseAll(stories(12), summarizer, { sleep });
    expect(summarizer.calls).toHaveLength(2);
    expect(result.stopped).toBe(true);
    expect(result.summaries.size).toBe(0);
    expect(result.errors[0]?.message).toBe("Fake: HTTP 503");
  });

  it("doesn't retry when over quota", async () => {
    const summarizer = fakeSummarizer([new SummarizerError("over quota", { retry: false })]);
    const result = await summariseAll(stories(3), summarizer, { sleep });
    expect(summarizer.calls).toHaveLength(1);
    expect(result.stopped).toBe(true);
  });
});
