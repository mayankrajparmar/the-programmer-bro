import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildPayload,
  dayBefore,
  describeResponse,
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  MAX_URLS,
  parseSitemap,
  selectUrls,
  SITE_URL,
  siteIsLive,
} from "./indexnow.ts";

// Real output from a production build (VERCEL_ENV=production npm run build).
const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const SITEMAP = fixture("sitemap.xml");
const ROBOTS = fixture("robots.txt");
const page = (path: string) => `${SITE_URL}${path}`;

describe("the IndexNow key", () => {
  it("follows the protocol's rules", () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-zA-Z0-9-]{8,128}$/);
  });

  it("is served from the site root, by public/<key>.txt", () => {
    const file = new URL(`../../public/${INDEXNOW_KEY}.txt`, import.meta.url);
    expect(readFileSync(file, "utf8").trim()).toBe(INDEXNOW_KEY);
  });

  it("points at the shared endpoint, which passes URLs on to every IndexNow engine", () => {
    expect(INDEXNOW_ENDPOINT).toBe("https://api.indexnow.org/indexnow");
    expect(SITE_URL).toBe("https://theprogrammerbro.in");
  });
});

describe("reading the sitemap", () => {
  const entries = parseSitemap(SITEMAP);

  it("finds every page, with its date where the sitemap gives one", () => {
    expect(entries).toHaveLength(20);
    expect(entries[0]).toEqual({ url: page("/") });
    expect(entries).toContainEqual({
      url: page("/learn/how-ai-works/transformer"),
      lastModified: "2026-11-02",
    });
    expect(entries.filter((entry) => !entry.lastModified).map((entry) => entry.url)).toEqual([
      page("/"),
      page("/learn"),
      page("/news"),
      page("/resources"),
    ]);
  });

  it("picks the pages that changed on or after a day, including their track", () => {
    expect(selectUrls(entries, "2026-11-02")).toEqual([
      page("/learn/how-ai-works"),
      page("/learn/how-ai-works/neural-networks"),
      page("/learn/how-ai-works/transformer"),
    ]);
    expect(selectUrls(entries, "2026-11-01")).toHaveLength(5);
    expect(selectUrls(entries, "2027-01-01")).toEqual([]);
  });

  it("sends every page, dated or not, when asked for all of them", () => {
    expect(selectUrls(entries, null)).toHaveLength(20);
  });

  it("never sends a page twice", () => {
    const twice = [...entries, ...entries];
    expect(selectUrls(twice, null)).toHaveLength(20);
  });
});

describe("dates", () => {
  it("goes back one day, across months and years", () => {
    expect(dayBefore("2026-11-02")).toBe("2026-11-01");
    expect(dayBefore("2026-11-01")).toBe("2026-10-31");
    expect(dayBefore("2027-01-01")).toBe("2026-12-31");
    expect(dayBefore("2028-03-01")).toBe("2028-02-29");
  });
});

describe("whether the site is live", () => {
  it("is live when robots.txt lets crawlers in and names the sitemap", () => {
    expect(siteIsLive(ROBOTS)).toBe(true);
  });

  it("isn't live in coming-soon mode, when robots.txt shuts everything", () => {
    expect(siteIsLive("User-Agent: *\nDisallow: /\n")).toBe(false);
    expect(
      siteIsLive("User-Agent: *\nDisallow: /\n\nSitemap: https://theprogrammerbro.in/sitemap.xml"),
    ).toBe(false);
  });
});

describe("the request", () => {
  it("sends our host, the key and where to find it", () => {
    const urls = [page("/learn/how-ai-works/transformer")];
    expect(buildPayload(urls)).toEqual({
      host: "theprogrammerbro.in",
      key: INDEXNOW_KEY,
      keyLocation: `https://theprogrammerbro.in/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    });
  });

  it("refuses URLs from another host, or too many at once", () => {
    expect(() => buildPayload(["https://example.com/page"])).toThrow(/Not on theprogrammerbro.in/);
    const many = Array.from({ length: MAX_URLS + 1 }, (_, i) => page(`/p${i}`));
    expect(() => buildPayload(many)).toThrow(/at most/);
  });

  it("treats 200 and 202 as success, and everything else as a failure", () => {
    expect(describeResponse(200).ok).toBe(true);
    expect(describeResponse(202)).toEqual({
      ok: true,
      message: "Received; the search engines are still checking the key.",
    });
    for (const status of [400, 403, 422, 429, 500]) expect(describeResponse(status).ok).toBe(false);
    expect(describeResponse(403).message).toMatch(/key file/);
  });
});
