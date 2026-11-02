/*
 * IndexNow: tells Bing (and the other search engines that share IndexNow submissions)
 * which pages changed, so they can recrawl them soon after a release. Google doesn't use
 * IndexNow; it reads the sitemap instead.
 *
 * The key isn't a secret: the protocol proves we own the site by serving it at
 * https://theprogrammerbro.in/<key>.txt, from public/. A unit test checks the file matches.
 * Protocol: https://www.indexnow.org/documentation
 */

export const SITE_URL = "https://theprogrammerbro.in";
export const INDEXNOW_KEY = "46eacde652636526c3a5cf84b7dff73f";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** The protocol's limit on URLs in one request. */
export const MAX_URLS = 10_000;

export interface SitemapEntry {
  url: string;
  /** YYYY-MM-DD, when the sitemap gives one. */
  lastModified?: string;
}

/** Reads the <url> entries of our sitemap.xml: each page's address and, if given, its date. */
export function parseSitemap(xml: string): SitemapEntry[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].flatMap(([, body = ""]) => {
    const url = /<loc>([^<]+)<\/loc>/.exec(body)?.[1]?.trim();
    if (!url) return [];
    const lastModified = /<lastmod>(\d{4}-\d{2}-\d{2})/.exec(body)?.[1];
    return [{ url, ...(lastModified && { lastModified }) }];
  });
}

/**
 * The pages to submit: those whose sitemap date is on or after `since` (YYYY-MM-DD), or
 * every page when `since` is null. Pages without a date (the home page, news) change too
 * often to state a date honestly, so they're only sent with every page.
 */
export function selectUrls(entries: readonly SitemapEntry[], since: string | null): string[] {
  const chosen = entries.filter(
    (entry) => since === null || (entry.lastModified !== undefined && entry.lastModified >= since),
  );
  return [...new Set(chosen.map((entry) => entry.url))];
}

/** The day before a YYYY-MM-DD date, so a release that lands just after midnight isn't missed. */
export function dayBefore(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

/** True when robots.txt lets search engines in, which it only does when the site is live. */
export function siteIsLive(robots: string): boolean {
  return /^Sitemap:/im.test(robots) && !/^Disallow:\s*\/\s*$/im.test(robots);
}

/** The JSON body IndexNow expects, for URLs on our own host only. */
export function buildPayload(urls: readonly string[], site = SITE_URL, key = INDEXNOW_KEY) {
  const host = new URL(site).host;
  const foreign = urls.filter((url) => new URL(url).host !== host);
  if (foreign.length > 0) throw new Error(`Not on ${host}: ${foreign.join(", ")}`);
  if (urls.length > MAX_URLS) throw new Error(`IndexNow takes at most ${MAX_URLS} URLs at once`);
  return { host, key, keyLocation: `${site}/${key}.txt`, urlList: [...urls] };
}

/** What each IndexNow response means, and whether it counts as success. */
export function describeResponse(status: number): { ok: boolean; message: string } {
  switch (status) {
    case 200:
      return { ok: true, message: "Submitted." };
    case 202:
      return { ok: true, message: "Received; the search engines are still checking the key." };
    case 400:
      return { ok: false, message: "IndexNow said the request was badly formed (400)." };
    case 403:
      return { ok: false, message: "IndexNow couldn't verify the key file on the site (403)." };
    case 422:
      return {
        ok: false,
        message: "IndexNow rejected the URLs or the key: they must be on our host (422).",
      };
    case 429:
      return { ok: false, message: "IndexNow says we're submitting too often (429)." };
    default:
      return { ok: false, message: `IndexNow answered with an unexpected status ${status}.` };
  }
}
