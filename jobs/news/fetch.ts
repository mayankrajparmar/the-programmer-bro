import { parseFeed } from "@rowanmanning/feed-parser";
import { z } from "zod";
import { MAX_AGE_HOURS } from "./filters.ts";
import { toPlainText, truncate } from "./text.ts";
import type { FetchedItem, Source } from "./types.ts";
import { siteName } from "./url.ts";

export const FETCH_TIMEOUT_MS = 10_000;
export const USER_AGENT = "TheProgrammerBroNews/1.0 (+https://theprogrammerbro.in)";
const SNIPPET_LENGTH = 600;

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** Stories from an RSS or Atom document. Items without a link or title are skipped. */
export function parseFeedItems(xml: string, source: Source): FetchedItem[] {
  const feed = parseFeed(xml);
  return feed.items.flatMap((item) => {
    const title = toPlainText(item.title);
    if (!item.url || !title) return [];
    return [
      {
        source,
        sourceName: source.name,
        url: item.url,
        title,
        snippet: truncate(toPlainText(item.description ?? item.content), SNIPPET_LENGTH),
        publishedAt: item.published ?? item.updated ?? null,
      },
    ];
  });
}

const HnResponseSchema = z.object({
  hits: z.array(
    z.looseObject({
      title: z.string().nullish(),
      url: z.string().nullish(),
      story_text: z.string().nullish(),
      created_at_i: z.number(),
    }),
  ),
});

/** Stories from the Hacker News search API. Ask HN and other posts without a link are skipped. */
export function parseHnItems(json: unknown, source: Source): FetchedItem[] {
  const { hits } = HnResponseSchema.parse(json);
  return hits.flatMap((hit) => {
    const title = toPlainText(hit.title);
    if (!hit.url || !title) return [];
    return [
      {
        source,
        sourceName: siteName(hit.url),
        url: hit.url,
        title,
        snippet: truncate(toPlainText(hit.story_text), SNIPPET_LENGTH),
        publishedAt: new Date(hit.created_at_i * 1000),
      },
    ];
  });
}

/** Adds the time window to a Hacker News search URL, keeping its other filters (e.g. points). */
export function hnSearchUrl(base: string, since: Date): string {
  const url = new URL(base);
  const window = `created_at_i>${Math.floor(since.getTime() / 1000)}`;
  const filters = url.searchParams.get("numericFilters");
  url.searchParams.set("numericFilters", filters ? `${filters},${window}` : window);
  return url.toString();
}

/** Reads one source. Throws on network errors, timeouts, bad status codes and unreadable feeds. */
export async function fetchSource(
  source: Source,
  { fetcher, now }: { fetcher: Fetcher; now: Date },
): Promise<FetchedItem[]> {
  const url =
    source.kind === "hn"
      ? hnSearchUrl(source.url, new Date(now.getTime() - MAX_AGE_HOURS * 3_600_000))
      : source.url;
  const response = await fetcher(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept:
        source.kind === "hn"
          ? "application/json"
          : "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  const body = await response.text();
  return source.kind === "hn"
    ? parseHnItems(JSON.parse(body), source)
    : parseFeedItems(body, source);
}

/**
 * The page's own description (og:description or meta description), for stories whose feed gives
 * little or no text, such as Hacker News links. Returns "" on any failure.
 */
export async function fetchPageDescription(url: string, fetcher: Fetcher): Promise<string> {
  try {
    const response = await fetcher(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok || !(response.headers.get("content-type") ?? "").includes("html")) return "";
    const html = (await response.text()).slice(0, 300_000);
    return truncate(describeHtml(html), SNIPPET_LENGTH);
  } catch {
    return "";
  }
}

/** The best description in an HTML document's head: og:description, then meta description. */
export function describeHtml(html: string): string {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const attribute = (tag: string, name: string) =>
    tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  const find = (key: string, value: string) => {
    for (const tag of metas) {
      const match = attribute(tag, key);
      if ((match?.[2] ?? match?.[3])?.toLowerCase() === value) {
        const content = attribute(tag, "content");
        return toPlainText(content?.[2] ?? content?.[3] ?? "");
      }
    }
    return "";
  };
  return find("property", "og:description") || find("name", "description");
}
