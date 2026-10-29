import { TOPIC_LABELS } from "../../src/features/news/topics.ts";
import type { RunReport } from "./run.ts";

/*
 * A readable account of a run, for the terminal and for the GitHub Actions run page.
 */

function plural(count: number, word: string) {
  if (count === 1) return `${count} ${word}`;
  return `${count} ${word.endsWith("y") ? `${word.slice(0, -1)}ies` : `${word}s`}`;
}

export function formatReport(report: RunReport, sourceOrder: string[]): string {
  const lines: string[] = [];
  const order = (name: string) => sourceOrder.indexOf(name);
  lines.push(`Status: ${report.status}${report.dryRun ? " (dry run: nothing was saved)" : ""}`);
  lines.push("", "Sources:");
  for (const source of [...report.sources].sort((a, b) => order(a.name) - order(b.name))) {
    const detail =
      source.status === "ok"
        ? plural(source.items, "story")
        : source.status === "off"
          ? "switched off after repeated failures"
          : `FAILED: ${source.error}`;
    lines.push(`  ${source.name.padEnd(24)} ${detail}`);
  }

  const { stats } = report;
  lines.push(
    "",
    `Fetched ${plural(report.fetched, "story")}. Dropped: ${stats.tooOld} older than 48 hours, ` +
      `${stats.notAboutAi} not about AI, ${stats.overSourceLimit} over a source's limit, ` +
      `${stats.seenBefore} already saved, ${stats.sameStory} the same story as another, ` +
      `${stats.badLink} with a bad link.`,
    `${plural(report.fresh, "new story")}; ${stats.overRunLimit} left for the next run by the per-run cap` +
      (report.deferred ? `, ${report.deferred} left because summarising stopped.` : "."),
    `${report.dryRun ? "Would save" : "Saved"} ${plural(report.saved, "story")}: ` +
      `${report.rows.filter((row) => row.status === "draft").length} drafts, ` +
      `${report.rows.filter((row) => row.status === "rejected").length} rejected as not about AI, ` +
      `${report.rows.filter((row) => row.status === "draft" && !row.summary).length} without a summary.`,
  );

  if (report.rows.length) {
    lines.push("", "Stories:");
    for (const row of report.rows) {
      const tag = row.status === "rejected" ? "not AI" : row.tag ? TOPIC_LABELS[row.tag] : "no tag";
      lines.push(`  [${tag}] ${row.title}  (${row.source_name})`);
      if (row.summary) lines.push(`      ${row.summary}`);
      lines.push(`      ${row.url}`);
    }
  }

  if (report.errors.length) {
    lines.push("", "Problems:");
    for (const error of report.errors) {
      lines.push(`  - ${error.stage}${error.source ? ` (${error.source})` : ""}: ${error.message}`);
    }
  }
  return lines.join("\n");
}
