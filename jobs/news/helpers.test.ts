import { describe, expect, it } from "vitest";
import { copiesFrom, countWords, decodeEntities, toPlainText, truncate } from "./text.ts";
import { similarity, TitleIndex } from "./similarity.ts";
import { isRecent, mentionsAi } from "./filters.ts";
import { hashUrl, normaliseUrl, siteName } from "./url.ts";
import { NOW } from "./test-helpers.ts";

describe("text helpers", () => {
  it("turn feed HTML into one line of plain text", () => {
    expect(toPlainText("<p>Fast &amp; small</p>\n<p>Runs on&nbsp;a laptop &#8212; free.</p>")).toBe(
      "Fast & small Runs on a laptop — free.",
    );
    expect(toPlainText("<style>p{}</style><b>Hi</b>")).toBe("Hi");
    expect(toPlainText(null)).toBe("");
    expect(decodeEntities("&unknown; &#x1F600;")).toBe("&unknown; 😀");
  });

  it("cut long text at a word boundary", () => {
    expect(truncate("short", 10)).toBe("short");
    expect(truncate("one two three four five", 12)).toBe("one two…");
  });

  it("count words", () => {
    expect(countWords("  two   words ")).toBe(2);
  });

  it("spot a summary that copies ten words in a row from the source", () => {
    const source =
      "The model reads prompts of up to one million tokens and runs on a single GPU at home.";
    expect(
      copiesFrom(
        "Good news: the model reads prompts of up to one million tokens and runs well.",
        source,
      ),
    ).toBe(true);
    expect(
      copiesFrom("A new open model handles very long prompts on one graphics card.", source),
    ).toBe(false);
    expect(copiesFrom("anything", "too short")).toBe(false);
  });
});

describe("links", () => {
  it("strip tracking, fragments, trailing slashes and host case", () => {
    expect(
      normaliseUrl("https://Lab.Example.com/blog/lumen-2/?utm_source=rss&id=7&fbclid=x#top")?.url,
    ).toBe("https://lab.example.com/blog/lumen-2?id=7");
  });

  it("give the same story the same key over http, https and www", () => {
    const keys = [
      "https://www.example.com/a/?b=2&a=1",
      "http://example.com/a?a=1&b=2&utm_campaign=x",
    ].map((url) => normaliseUrl(url)?.key);
    expect(keys[0]).toBe("example.com/a?a=1&b=2");
    expect(keys[1]).toBe(keys[0]);
    expect(hashUrl(keys[0]!)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("reject links that aren't web pages", () => {
    expect(normaliseUrl("mailto:hi@example.com")).toBeNull();
    expect(normaliseUrl("not a url")).toBeNull();
  });

  it("name a link's site", () => {
    expect(siteName("https://www.github.com/example/repo")).toBe("github.com");
  });
});

describe("title similarity", () => {
  it("matches Postgres pg_trgm", () => {
    // pg_trgm: similarity('word', 'words') = 0.571429 and similarity('word', 'two words') = 0.363636
    expect(similarity("word", "words")).toBeCloseTo(4 / 7, 5);
    expect(similarity("word", "two words")).toBeCloseTo(4 / 11, 5);
  });

  it("treats two outlets' headlines for one story as the same story", () => {
    const index = new TitleIndex([
      "Introducing Lumen 2, a smaller open model with a longer context window",
    ]);
    expect(
      index.hasSimilar("Lumen 2: lab releases smaller open model with longer context window"),
    ).toBe(true);
    expect(index.hasSimilar("Government opens consultation on AI rules for public services")).toBe(
      false,
    );
  });
});

describe("filters", () => {
  it("find stories about AI without matching ordinary words", () => {
    expect(mentionsAi("IndiaAI mission funds new GPUs")).toBe(true);
    expect(mentionsAi("Startup adds AI search to its app")).toBe(true);
    expect(mentionsAi("Google's Gemini gets a new feature")).toBe(true);
    expect(mentionsAi("Sarvam releases a Hindi speech model")).toBe(true);
    expect(mentionsAi("The minister said the rail line will open in May")).toBe(false);
    expect(mentionsAi("New budget smartphone with a bigger battery")).toBe(false);
  });

  it("keep stories from the last 48 hours", () => {
    const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000);
    expect(isRecent(hoursAgo(47), NOW)).toBe(true);
    expect(isRecent(hoursAgo(49), NOW)).toBe(false);
    expect(isRecent(hoursAgo(-0.5), NOW)).toBe(true);
    expect(isRecent(hoursAgo(-5), NOW)).toBe(false);
  });
});
