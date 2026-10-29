import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewsItemRow, RunError, RunStatus, Source, SourceConfig } from "./types.ts";

/** After this many failed runs in a row, a source is switched off until someone turns it back on. */
export const MAX_CONSECUTIVE_FAILURES = 5;

export interface RunTotals {
  status: RunStatus;
  fetched: number;
  fresh: number;
  saved: number;
  errors: RunError[];
}

/** Everything the job reads from and writes to the database. */
export interface NewsStore {
  /** The configured sources with their database state (id, on/off, failures). */
  syncSources(configs: SourceConfig[]): Promise<Source[]>;
  recordFetch(source: Source, result: { ok: true } | { ok: false; error: string }): Promise<void>;
  knownHashes(hashes: string[]): Promise<Set<string>>;
  recentTitles(since: Date): Promise<string[]>;
  /** Inserts new stories, ignoring links that are already saved. Returns how many were added. */
  saveItems(rows: NewsItemRow[]): Promise<number>;
  startRun(): Promise<string | null>;
  finishRun(id: string | null, totals: RunTotals): Promise<void>;
}

const JOB = "news-ingest";

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

function offlineSource(config: SourceConfig): Source {
  return { ...config, id: null, active: true, consecutiveFailures: 0 };
}

/**
 * The real store, using the service-role key. With `dryRun`, it reads (to find duplicates)
 * but never writes, so a dry run can't change the database.
 */
export function createSupabaseStore(
  db: SupabaseClient,
  { dryRun = false, now = () => new Date() }: { dryRun?: boolean; now?: () => Date } = {},
): NewsStore {
  return {
    async syncSources(configs) {
      const rows = configs.map((config) => ({
        name: config.name,
        kind: config.kind,
        url: config.url,
        default_tag: config.defaultTag ?? null,
        filter_ai: config.filterAi,
        max_items: config.maxItems,
      }));
      const query = dryRun
        ? db
            .from("news_sources")
            .select("id, url, active, consecutive_failures")
            .in(
              "url",
              configs.map((config) => config.url),
            )
        : db
            .from("news_sources")
            .upsert(rows, { onConflict: "url" })
            .select("id, url, active, consecutive_failures");
      const { data, error } = await query;
      if (error) fail("Reading news sources", error);
      const byUrl = new Map(
        (data as { id: string; url: string; active: boolean; consecutive_failures: number }[]).map(
          (row) => [row.url, row],
        ),
      );
      return configs.map((config) => {
        const row = byUrl.get(config.url);
        return row
          ? {
              ...config,
              id: row.id,
              active: row.active,
              consecutiveFailures: row.consecutive_failures,
            }
          : offlineSource(config);
      });
    },

    async recordFetch(source, result) {
      if (dryRun || !source.id) return;
      const failures = result.ok ? 0 : source.consecutiveFailures + 1;
      const { error } = await db
        .from("news_sources")
        .update({
          consecutive_failures: failures,
          last_error: result.ok ? null : result.error.slice(0, 500),
          ...(result.ok ? { last_fetched_at: now().toISOString() } : {}),
          ...(failures >= MAX_CONSECUTIVE_FAILURES ? { active: false } : {}),
        })
        .eq("id", source.id);
      if (error) fail(`Updating source ${source.name}`, error);
    },

    async knownHashes(hashes) {
      const known = new Set<string>();
      for (let start = 0; start < hashes.length; start += 100) {
        const { data, error } = await db
          .from("news_items")
          .select("url_hash")
          .in("url_hash", hashes.slice(start, start + 100));
        if (error) fail("Looking up saved links", error);
        for (const row of data as { url_hash: string }[]) known.add(row.url_hash);
      }
      return known;
    },

    async recentTitles(since) {
      const { data, error } = await db
        .from("news_items")
        .select("source_title")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) fail("Reading recent titles", error);
      return (data as { source_title: string }[]).map((row) => row.source_title);
    },

    async saveItems(rows) {
      if (dryRun || rows.length === 0) return dryRun ? rows.length : 0;
      const { data, error } = await db
        .from("news_items")
        .upsert(rows, { onConflict: "url_hash", ignoreDuplicates: true })
        .select("id");
      if (error) fail("Saving stories", error);
      return (data as unknown[]).length;
    },

    async startRun() {
      if (dryRun) return null;
      const { data, error } = await db.from("job_runs").insert({ job: JOB }).select("id").single();
      if (error) fail("Starting the run log", error);
      return (data as { id: string }).id;
    },

    async finishRun(id, totals) {
      if (dryRun || !id) return;
      const { error } = await db
        .from("job_runs")
        .update({
          status: totals.status,
          items_fetched: totals.fetched,
          items_new: totals.fresh,
          items_saved: totals.saved,
          errors: totals.errors,
          finished_at: now().toISOString(),
        })
        .eq("id", id);
      if (error) fail("Finishing the run log", error);
    },
  };
}

/** For dry runs with no database configured: nothing is known and nothing is written. */
export function createOfflineStore(): NewsStore {
  return {
    async syncSources(configs) {
      return configs.map(offlineSource);
    },
    async recordFetch() {},
    async knownHashes() {
      return new Set();
    },
    async recentTitles() {
      return [];
    },
    async saveItems(rows) {
      return rows.length;
    },
    async startRun() {
      return null;
    },
    async finishRun() {},
  };
}
