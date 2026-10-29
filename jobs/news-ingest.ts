/**
 * The news job: reads the sources in content/news-sources.json, keeps new AI stories,
 * has Gemini summarise them and saves them as drafts for approval at /admin/news.
 * GitHub Actions runs it every four hours (.github/workflows/news-ingest.yml).
 *
 *   node jobs/news-ingest.ts              fetch, summarise and save drafts
 *   node jobs/news-ingest.ts --dry-run    fetch and summarise, then print what would be saved
 *   node jobs/news-ingest.ts --dry-run --no-summaries --strict
 *                                         only check that every source responds (CI does this)
 *   --source "Hugging Face"               read one source only
 *
 * Environment: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the database),
 * GEMINI_API_KEY (summaries), and optionally GEMINI_MODEL and NEWS_MAX_ITEMS (default 20).
 * A dry run works without any of them.
 */
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { createGeminiSummarizer, DEFAULT_GEMINI_MODEL } from "./news/gemini.ts";
import { formatReport } from "./news/report.ts";
import { runIngest } from "./news/run.ts";
import { loadSources } from "./news/sources.ts";
import { createOfflineStore, createSupabaseStore } from "./news/store.ts";

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    "no-summaries": { type: "boolean", default: false },
    strict: { type: "boolean", default: false },
    source: { type: "string" },
  },
});
const dryRun = args["dry-run"];
const env = process.env;

function stop(message: string): never {
  console.error(message);
  process.exit(1);
}

if (args["no-summaries"] && !dryRun) stop("--no-summaries only works with --dry-run.");

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = env.GEMINI_API_KEY;
const hasDatabase = Boolean(supabaseUrl && serviceKey);

if (!dryRun) {
  const missing = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
    !geminiKey && "GEMINI_API_KEY",
  ].filter(Boolean);
  if (missing.length) stop(`Missing ${missing.join(", ")}. Add them as GitHub Actions secrets.`);
}

const maxItems = Math.min(50, Math.max(1, Number.parseInt(env.NEWS_MAX_ITEMS ?? "", 10) || 20));
let configs = loadSources();
if (args.source) {
  const wanted = args.source.toLowerCase();
  configs = configs.filter((config) => config.name.toLowerCase().includes(wanted));
  if (configs.length === 0) stop(`No source matches "${args.source}".`);
}

const store = hasDatabase
  ? createSupabaseStore(
      createClient(supabaseUrl!, serviceKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      { dryRun },
    )
  : createOfflineStore();

const summarizer =
  args["no-summaries"] || !geminiKey
    ? null
    : createGeminiSummarizer({
        apiKey: geminiKey,
        model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      });

if (dryRun) {
  console.log(
    `Dry run: nothing will be saved. ${hasDatabase ? "Checking duplicates against the database." : "No database configured."} ` +
      `${summarizer ? `Summarising with ${summarizer.name}.` : "Not summarising."}`,
  );
}

const report = await runIngest(
  { configs, store, summarizer, fetcher: fetch },
  { dryRun, maxItems },
);

const text = formatReport(
  report,
  configs.map((config) => config.name),
);
console.log(text);
if (env.GITHUB_STEP_SUMMARY) {
  appendFileSync(env.GITHUB_STEP_SUMMARY, `## News ingest\n\n\`\`\`text\n${text}\n\`\`\`\n`);
}

const sourceFailed = report.sources.some((source) => source.status === "failed");
if (report.status === "failed" || (args.strict && sourceFailed)) process.exit(1);
