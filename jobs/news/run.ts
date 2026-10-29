import { fetchPageDescription, fetchSource, type Fetcher } from "./fetch.ts";
import { capRun, dedupe, emptyStats, prefilter, type SelectionStats } from "./select.ts";
import type { NewsStore } from "./store.ts";
import { messageOf, summariseAll, type Summarizer } from "./summarize.ts";
import type {
  Candidate,
  FetchedItem,
  NewsItemRow,
  RunError,
  RunStatus,
  Source,
  SourceConfig,
  Summary,
} from "./types.ts";

/** Same-story checks look this far back. */
const SIMILAR_TITLE_DAYS = 3;
/** Snippets shorter than this get the page's own description instead, when it has one. */
const THIN_SNIPPET = 80;

export interface RunOptions {
  /** Fetch and summarise, but save nothing. */
  dryRun: boolean;
  /** The most stories one run saves; the rest wait for the next run. */
  maxItems: number;
}

export interface RunDeps {
  configs: SourceConfig[];
  store: NewsStore;
  /** null skips summarising (dry runs only). */
  summarizer: Summarizer | null;
  fetcher: Fetcher;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
}

export interface SourceReport {
  name: string;
  status: "ok" | "failed" | "off";
  items: number;
  error?: string;
}

export interface RunReport {
  status: RunStatus;
  dryRun: boolean;
  fetched: number;
  /** Left after filtering and removing duplicates, before the per-run cap. */
  fresh: number;
  saved: number;
  stats: SelectionStats;
  sources: SourceReport[];
  rows: NewsItemRow[];
  /** Stories not saved because summarising stopped; the next run tries them again. */
  deferred: number;
  errors: RunError[];
}

export function toRow(candidate: Candidate, summary: Summary | null | undefined): NewsItemRow {
  const base = {
    source_id: candidate.source.id,
    source_name: candidate.sourceName,
    url: candidate.url,
    url_hash: candidate.urlHash,
    source_title: candidate.title,
    source_published_at: candidate.publishedAt.toISOString(),
  };
  if (!summary) {
    // No summary yet: a person writes one before approving.
    return {
      ...base,
      title: candidate.title,
      summary: null,
      tag: candidate.source.defaultTag ?? null,
      status: "draft",
    };
  }
  if (summary.tag === "skip") {
    // Not about AI: saved as rejected so it never comes back.
    return { ...base, title: candidate.title, summary: null, tag: null, status: "rejected" };
  }
  return {
    ...base,
    title: summary.headline,
    summary: summary.summary,
    tag: summary.tag,
    status: "draft",
  };
}

/** One ingest run: fetch → filter → dedupe → summarise → save, recorded in job_runs. */
export async function runIngest(deps: RunDeps, options: RunOptions): Promise<RunReport> {
  const now = (deps.now ?? (() => new Date()))();
  const { store, summarizer, fetcher } = deps;
  const errors: RunError[] = [];
  const stats = emptyStats();
  const sourceOrder = deps.configs.map((config) => config.name);
  const report: RunReport = {
    status: "ok",
    dryRun: options.dryRun,
    fetched: 0,
    fresh: 0,
    saved: 0,
    stats,
    sources: [],
    rows: [],
    deferred: 0,
    errors,
  };

  let runId: string | null = null;
  try {
    runId = await store.startRun();
    const sources = await store.syncSources(deps.configs);

    const fetched = await Promise.all(sources.map((source) => readSource(source)));
    const items = fetched.flat();
    report.fetched = items.length;

    const prepared = prefilter(items, now, stats);
    const knownHashes = await store.knownHashes(prepared.map((item) => item.urlHash));
    const recentTitles = await store.recentTitles(
      new Date(now.getTime() - SIMILAR_TITLE_DAYS * 86_400_000),
    );
    const fresh = dedupe(prepared, { knownHashes, recentTitles, sourceOrder }, stats);
    report.fresh = fresh.length;
    const candidates = capRun(fresh, options.maxItems, sourceOrder, stats);

    await Promise.all(
      candidates
        .filter((candidate) => candidate.snippet.length < THIN_SNIPPET)
        .map(async (candidate) => {
          const description = await fetchPageDescription(candidate.url, fetcher);
          if (description.length > candidate.snippet.length) candidate.snippet = description;
        }),
    );

    let rows: NewsItemRow[];
    if (summarizer) {
      const result = await summariseAll(candidates, summarizer, { sleep: deps.sleep });
      errors.push(...result.errors);
      rows = candidates.flatMap((candidate) =>
        result.summaries.has(candidate.key)
          ? [toRow(candidate, result.summaries.get(candidate.key))]
          : [],
      );
      report.deferred = candidates.length - rows.length;
    } else {
      rows = candidates.map((candidate) => toRow(candidate, null));
    }
    report.rows = rows;
    report.saved = await store.saveItems(rows);

    const active = report.sources.filter((source) => source.status !== "off");
    const allSourcesFailed =
      active.length > 0 && active.every((source) => source.status === "failed");
    const nothingSummarised = candidates.length > 0 && rows.length === 0;
    report.status =
      allSourcesFailed || nothingSummarised ? "failed" : errors.length ? "partial" : "ok";
  } catch (error) {
    errors.push({ stage: "run", message: messageOf(error) });
    report.status = "failed";
  }

  try {
    await store.finishRun(runId, {
      status: report.status,
      fetched: report.fetched,
      fresh: report.fresh,
      saved: report.saved,
      errors,
    });
  } catch (error) {
    errors.push({ stage: "run", message: messageOf(error) });
    report.status = "failed";
  }
  return report;

  async function readSource(source: Source): Promise<FetchedItem[]> {
    if (!source.active) {
      report.sources.push({ name: source.name, status: "off", items: 0 });
      return [];
    }
    try {
      const items = await fetchSource(source, { fetcher, now });
      report.sources.push({ name: source.name, status: "ok", items: items.length });
      await store.recordFetch(source, { ok: true });
      return items;
    } catch (error) {
      const message = messageOf(error);
      report.sources.push({ name: source.name, status: "failed", items: 0, error: message });
      errors.push({ source: source.name, stage: "fetch", message });
      await store.recordFetch(source, { ok: false, error: message });
      return [];
    }
  }
}
