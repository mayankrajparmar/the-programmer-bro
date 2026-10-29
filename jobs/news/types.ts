import type { NewsTopic } from "../../src/features/news/topics.ts";

export type { NewsTopic };

export type SourceKind = "rss" | "arxiv" | "hn";

/** A source as configured in content/news-sources.json. */
export interface SourceConfig {
  name: string;
  kind: SourceKind;
  url: string;
  defaultTag?: NewsTopic | undefined;
  filterAi: boolean;
  maxItems: number;
}

/** A configured source joined with its database row (no row in a dry run without a database). */
export interface Source extends SourceConfig {
  id: string | null;
  active: boolean;
  consecutiveFailures: number;
}

/** One story as read from a source, before filtering. */
export interface FetchedItem {
  source: Source;
  /** Who published the story: the feed's name, or the link's site for Hacker News. */
  sourceName: string;
  url: string;
  title: string;
  /** Plain-text opening of the story, for the summariser. Can be empty. */
  snippet: string;
  publishedAt: Date | null;
}

/** A story that passed the filters and isn't a duplicate. */
export interface Candidate extends FetchedItem {
  /** Short id used in summariser prompts, e.g. "c3". */
  key: string;
  urlHash: string;
  publishedAt: Date;
}

/** What the summariser made of one story. */
export interface Summary {
  headline: string;
  summary: string;
  /** "skip" means the story isn't about AI. */
  tag: NewsTopic | "skip";
}

/** A row for news_items. */
export interface NewsItemRow {
  source_id: string | null;
  source_name: string;
  url: string;
  url_hash: string;
  source_title: string;
  title: string;
  summary: string | null;
  tag: NewsTopic | null;
  status: "draft" | "rejected";
  source_published_at: string;
}

export interface RunError {
  source?: string;
  stage: "fetch" | "summarise" | "save" | "run";
  message: string;
}

export type RunStatus = "ok" | "partial" | "failed";
