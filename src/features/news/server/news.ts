import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/clients";
import { dayKey } from "../dates";
import { NEWS_TOPICS } from "../topics";
import type { NewsItem } from "../view";

/** Cache tag for every page that shows approved news. Admin actions expire it. */
export const NEWS_CACHE_TAG = "news";

/** The News page shows up to this many stories from the last month. */
const LIMIT = 100;
const WINDOW_DAYS = 30;

const RowSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  summary: z.string().min(1),
  tag: z.enum(NEWS_TOPICS),
  url: z.url(),
  source_name: z.string().min(1),
  source_published_at: z.string(),
});

/**
 * Approved stories, newest first. Cached and prerendered; refreshed hourly, and at once when a
 * story is approved or taken down (see NEWS_CACHE_TAG).
 */
export async function getLatestNews(): Promise<NewsItem[]> {
  "use cache";
  cacheTag(NEWS_CACHE_TAG);
  cacheLife("hours");
  return loadLatestNews(new Date());
}

async function loadLatestNews(now: Date): Promise<NewsItem[]> {
  if (fixturesEnabled()) return fixtureNews(now);

  const db = createPublicClient();
  if (!db) return []; // No database configured (local or CI): the page shows its empty state.

  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000).toISOString();
  // No status filter: RLS only lets the public read approved stories.
  const { data, error } = await db
    .from("news_items")
    .select("id, title, summary, tag, url, source_name, source_published_at")
    .gte("source_published_at", since)
    .order("source_published_at", { ascending: false })
    .limit(LIMIT);

  if (error) {
    // A database hiccup must not fail a deploy of the lessons: build with no news, refresh soon.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.error(`News: couldn't load stories while building (${error.message})`);
      return [];
    }
    // At request time, throwing keeps the last good version of the page.
    throw new Error(`News: couldn't load stories (${error.message})`);
  }

  return (data ?? []).flatMap((row) => {
    const parsed = RowSchema.safeParse(row);
    if (!parsed.success) return [];
    const { source_name, source_published_at, ...rest } = parsed.data;
    return [{ ...rest, sourceName: source_name, publishedAt: source_published_at }];
  });
}

/*
 * Sample stories for browser tests: build with NEWS_FIXTURES=1. Ignored in production.
 */

function fixturesEnabled() {
  return process.env.NEWS_FIXTURES === "1" && process.env.VERCEL_ENV !== "production";
}

const FixtureSchema = z.array(
  RowSchema.omit({ id: true, source_published_at: true }).extend({
    daysAgo: z.number().int().min(0),
  }),
);

function fixtureNews(now: Date): NewsItem[] {
  const file = path.join(process.cwd(), "e2e", "fixtures", "news.json");
  const stories = FixtureSchema.parse(JSON.parse(readFileSync(file, "utf8")));
  const midnightInIndia = new Date(`${dayKey(now)}T00:00:00+05:30`).getTime();
  return stories
    .map(({ daysAgo, source_name, ...story }, index) => ({
      ...story,
      id: `fixture-${index + 1}`,
      sourceName: source_name,
      // 9am in India on the given day, a minute apart so the order is stable.
      publishedAt: new Date(
        midnightInIndia - daysAgo * 86_400_000 + 9 * 3_600_000 - index * 60_000,
      ).toISOString(),
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
