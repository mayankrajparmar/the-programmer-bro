import "server-only";
import { createServiceClient } from "@/lib/supabase/clients";
import { isNewsTopic, type NewsTopic } from "../topics";

/*
 * What the admin page reads. Uses the service role, so call these only after requireAdmin().
 */

export interface StoryForReview {
  id: string;
  status: "draft" | "approved" | "rejected";
  title: string;
  sourceTitle: string;
  summary: string | null;
  tag: NewsTopic | null;
  url: string;
  sourceName: string;
  publishedAt: string;
}

export interface RunError {
  source?: string;
  stage: string;
  message: string;
}

export interface JobRun {
  id: string;
  status: "running" | "ok" | "partial" | "failed";
  startedAt: string;
  finishedAt: string | null;
  fetched: number;
  fresh: number;
  saved: number;
  errors: RunError[];
}

export interface SourceHealth {
  id: string;
  name: string;
  url: string;
  active: boolean;
  failures: number;
  lastError: string | null;
}

export interface AdminNewsData {
  configured: boolean;
  drafts: StoryForReview[];
  live: StoryForReview[];
  runs: JobRun[];
  /** Sources that are switched off or failing. */
  troubledSources: SourceHealth[];
  error: string | null;
}

const STORY_COLUMNS =
  "id, status, title, source_title, summary, tag, url, source_name, source_published_at";

interface StoryRow {
  id: string;
  status: StoryForReview["status"];
  title: string;
  source_title: string;
  summary: string | null;
  tag: string | null;
  url: string;
  source_name: string;
  source_published_at: string;
}

function toStory(row: StoryRow): StoryForReview {
  return {
    id: row.id,
    status: row.status,
    title: row.title,
    sourceTitle: row.source_title,
    summary: row.summary,
    tag: isNewsTopic(row.tag) ? row.tag : null,
    url: row.url,
    sourceName: row.source_name,
    publishedAt: row.source_published_at,
  };
}

export async function loadAdminNews(): Promise<AdminNewsData> {
  const empty: AdminNewsData = {
    configured: false,
    drafts: [],
    live: [],
    runs: [],
    troubledSources: [],
    error: null,
  };
  const db = createServiceClient();
  if (!db) return empty;

  const [drafts, live, runs, sources] = await Promise.all([
    db
      .from("news_items")
      .select(STORY_COLUMNS)
      .eq("status", "draft")
      .order("source_published_at", { ascending: false })
      .limit(60),
    db
      .from("news_items")
      .select(STORY_COLUMNS)
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(15),
    db
      .from("job_runs")
      .select("id, status, started_at, finished_at, items_fetched, items_new, items_saved, errors")
      .eq("job", "news-ingest")
      .order("started_at", { ascending: false })
      .limit(6),
    db
      .from("news_sources")
      .select("id, name, url, active, consecutive_failures, last_error")
      .or("active.eq.false,consecutive_failures.gt.0")
      .order("name"),
  ]);

  const failed = [drafts, live, runs, sources].find((result) => result.error);
  if (failed?.error) {
    return { ...empty, configured: true, error: failed.error.message };
  }

  return {
    configured: true,
    error: null,
    drafts: (drafts.data as StoryRow[]).map(toStory),
    live: (live.data as StoryRow[]).map(toStory),
    runs: (
      runs.data as {
        id: string;
        status: JobRun["status"];
        started_at: string;
        finished_at: string | null;
        items_fetched: number;
        items_new: number;
        items_saved: number;
        errors: RunError[] | null;
      }[]
    ).map((row) => ({
      id: row.id,
      status: row.status,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      fetched: row.items_fetched,
      fresh: row.items_new,
      saved: row.items_saved,
      errors: Array.isArray(row.errors) ? row.errors : [],
    })),
    troubledSources: (
      sources.data as {
        id: string;
        name: string;
        url: string;
        active: boolean;
        consecutive_failures: number;
        last_error: string | null;
      }[]
    ).map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      active: row.active,
      failures: row.consecutive_failures,
      lastError: row.last_error,
    })),
  };
}
