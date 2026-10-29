import { readFileSync } from "node:fs";
import { z } from "zod";
import { NEWS_TOPICS } from "../../src/features/news/topics.ts";
import type { SourceConfig } from "./types.ts";

export const SOURCES_FILE = new URL("../../content/news-sources.json", import.meta.url);

const SourceSchema = z
  .object({
    name: z.string().min(1).max(60),
    kind: z.enum(["rss", "arxiv", "hn"]),
    url: z.url({ protocol: /^https$/ }),
    defaultTag: z.enum(NEWS_TOPICS).optional(),
    filterAi: z.boolean().default(false),
    maxItems: z.number().int().min(1).max(50).default(5),
  })
  .strict();

const SourcesFileSchema = z
  .object({
    $comment: z.string().optional(),
    sources: z.array(SourceSchema).min(1),
  })
  .strict()
  .superRefine((file, ctx) => {
    for (const key of ["name", "url"] as const) {
      const values = file.sources.map((source) => source[key]);
      const repeated = values.find((value, index) => values.indexOf(value) !== index);
      if (repeated) ctx.addIssue({ code: "custom", message: `${key} "${repeated}" is used twice` });
    }
  });

/** Validates the sources file. Throws with every problem listed. */
export function parseSources(data: unknown): SourceConfig[] {
  const parsed = SourcesFileSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(file)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`content/news-sources.json: ${issues}`);
  }
  return parsed.data.sources;
}

export function loadSources(file: URL = SOURCES_FILE): SourceConfig[] {
  return parseSources(JSON.parse(readFileSync(file, "utf8")));
}
