import { z } from "zod";
import { NEWS_TOPICS } from "../../src/features/news/topics.ts";
import { copiesFrom, countWords } from "./text.ts";
import type { Candidate, RunError, Summary } from "./types.ts";

/*
 * Summaries are written by a language model behind the small Summarizer interface,
 * so switching provider (Gemini today, Groq as a fallback) touches one file.
 * Every reply is checked here before anything is saved.
 */

export const SYSTEM_PROMPT = `You summarise AI news for students and developers in India.

For each item, return:
- headline: a plain-English headline in your own words, at most 90 characters. No clickbait and no questions.
- summary: 2 or 3 sentences, at most 60 words, in plain English and in your own words. Never copy sentences from the source. Say what happened, then why it matters to someone learning AI.
- tag: one of models, tools, research, policy, india. Use india when the story is mainly about India. If the item is not about AI, use "skip".

Use only the facts in the item's title and snippet. Don't add names, numbers, dates or claims that aren't there. If the snippet is empty, keep the summary short and general.
Write simple English, and explain any jargon in a few words.
Return JSON that matches the schema, with one entry for every item, using the same ids.`;

const TAGS = [...NEWS_TOPICS, "skip"] as const;

/** JSON Schema for the reply, in the subset Gemini's structured output supports. */
export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "The id of the item this entry is for." },
          headline: {
            type: "string",
            description: "Plain-English headline, at most 90 characters.",
          },
          summary: { type: "string", description: "2 or 3 sentences, at most 60 words." },
          tag: { type: "string", enum: [...TAGS] },
        },
        required: ["id", "headline", "summary", "tag"],
      },
    },
  },
  required: ["items"],
} as const;

export interface SummaryInput {
  id: string;
  title: string;
  source: string;
  snippet: string;
}

export interface Summarizer {
  readonly name: string;
  /** Sends one batch and returns the raw reply text (JSON matching RESPONSE_SCHEMA). */
  summarize(items: SummaryInput[]): Promise<string>;
}

/** A failed request. `retry` means trying again shortly may work; quota errors don't. */
export class SummarizerError extends Error {
  readonly retry: boolean;

  constructor(message: string, { retry }: { retry: boolean }) {
    super(message);
    this.name = "SummarizerError";
    this.retry = retry;
  }
}

export function toSummaryInput(candidate: Candidate): SummaryInput {
  return {
    id: candidate.key,
    title: candidate.title,
    source: candidate.sourceName,
    snippet: candidate.snippet,
  };
}

const ReplySchema = z.object({
  items: z.array(
    z.looseObject({
      id: z.string(),
      headline: z.string(),
      summary: z.string(),
      tag: z.string(),
    }),
  ),
});

const clean = (text: string) =>
  text
    .trim()
    .replace(/^["“'‘]+|["”'’]+$/g, "")
    .replace(/\s+/g, " ");

/** Why a reply entry can't be used, or null if it can. */
export function checkSummary(
  entry: { headline: string; summary: string; tag: string },
  input: SummaryInput,
): string | null {
  if (!(TAGS as readonly string[]).includes(entry.tag)) return `unknown tag "${entry.tag}"`;
  if (entry.tag === "skip") return null;
  const headline = clean(entry.headline);
  if (headline.length < 10 || headline.length > 120) return "headline length";
  const summary = clean(entry.summary);
  const words = countWords(summary);
  if (words < 12 || words > 75 || summary.length > 600) return `summary has ${words} words`;
  if (copiesFrom(summary, input.snippet) || copiesFrom(summary, input.title)) {
    return "summary copies the source";
  }
  return null;
}

/** Splits a reply into usable summaries and the ids that need another try. */
export function parseSummaries(
  text: string,
  inputs: SummaryInput[],
): { valid: Map<string, Summary>; invalid: Map<string, string> } {
  const valid = new Map<string, Summary>();
  const invalid = new Map<string, string>();
  const byId = new Map(inputs.map((input) => [input.id, input]));

  let reply: z.infer<typeof ReplySchema> | null = null;
  try {
    reply = ReplySchema.parse(JSON.parse(text));
  } catch {
    reply = null;
  }

  for (const entry of reply?.items ?? []) {
    const input = byId.get(entry.id);
    if (!input || valid.has(entry.id)) continue;
    const problem = checkSummary(entry, input);
    if (problem) {
      invalid.set(entry.id, problem);
      continue;
    }
    const tag = entry.tag as Summary["tag"];
    valid.set(entry.id, {
      headline: tag === "skip" ? input.title : clean(entry.headline),
      summary: tag === "skip" ? "" : clean(entry.summary),
      tag,
    });
  }
  for (const input of inputs) {
    if (!valid.has(input.id) && !invalid.has(input.id)) {
      invalid.set(input.id, reply ? "missing from the reply" : "reply wasn't valid JSON");
    }
  }
  return { valid, invalid };
}

export interface SummariseResult {
  /** A summary, or null when the model answered but its summary failed the checks twice. */
  summaries: Map<string, Summary | null>;
  errors: RunError[];
  /** True when requests failed, so later stories were left for the next run. */
  stopped: boolean;
}

/**
 * Summarises candidates in batches. A batch with bad entries is retried once for those entries;
 * entries that fail again are kept with no summary for a person to write. A failed request is
 * retried once if the error allows; after that, summarising stops and the remaining stories
 * aren't saved, so the next run picks them up again.
 */
export async function summariseAll(
  candidates: Candidate[],
  summarizer: Summarizer,
  {
    batchSize = 10,
    pauseMs = 4_000,
    retryPauseMs = 20_000,
    sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  }: {
    batchSize?: number;
    pauseMs?: number;
    retryPauseMs?: number;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<SummariseResult> {
  const summaries = new Map<string, Summary | null>();
  const errors: RunError[] = [];
  let stopped = false;

  for (let start = 0; start < candidates.length && !stopped; start += batchSize) {
    if (start > 0) await sleep(pauseMs);
    let pending = candidates.slice(start, start + batchSize).map(toSummaryInput);

    for (let attempt = 1; attempt <= 2 && pending.length > 0; attempt++) {
      let text: string;
      try {
        text = await summarizer.summarize(pending);
      } catch (error) {
        const retry = error instanceof SummarizerError ? error.retry : true;
        if (attempt === 1 && retry) {
          await sleep(retryPauseMs);
          continue;
        }
        errors.push({ stage: "summarise", message: `${summarizer.name}: ${messageOf(error)}` });
        stopped = true;
        break;
      }

      const { valid, invalid } = parseSummaries(text, pending);
      for (const [id, summary] of valid) summaries.set(id, summary);
      pending = pending.filter((input) => invalid.has(input.id));
      if (pending.length === 0) break;

      if (attempt === 1) {
        await sleep(pauseMs);
      } else {
        for (const input of pending) summaries.set(input.id, null);
        const reasons = [...new Set(pending.map((input) => invalid.get(input.id)))].join(", ");
        errors.push({
          stage: "summarise",
          message: `${pending.length} ${pending.length === 1 ? "summary" : "summaries"} failed the checks twice (${reasons}); saved without a summary`,
        });
      }
    }
  }
  return { summaries, errors, stopped };
}

/** An error's message, with the underlying cause for network errors ("fetch failed: ENOTFOUND"). */
export function messageOf(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if (error.name === "TimeoutError") return "timed out";
  const cause = error.cause as { code?: string; message?: string } | undefined;
  const detail = cause?.code ?? cause?.message;
  return detail && !error.message.includes(detail) ? `${error.message}: ${detail}` : error.message;
}
