import { z } from "zod";
import { NEWS_TOPICS, type NewsTopic } from "../topics";

/*
 * Checking an admin's edit before it touches the database. Pure, so it's easy to test;
 * the Server Action in actions.ts does the auth check and the write.
 */

export const REVIEW_INTENTS = ["approve", "save", "reject"] as const;
export type ReviewIntent = (typeof REVIEW_INTENTS)[number];

export interface Review {
  id: string;
  intent: ReviewIntent;
  title: string;
  summary: string | null;
  tag: NewsTopic | null;
}

const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim());

const ReviewSchema = z.object({
  id: z.uuid("Unknown story."),
  intent: z.enum(REVIEW_INTENTS, "Unknown action."),
  title: z
    .string()
    .trim()
    .min(10, "The headline needs at least 10 characters.")
    .max(160, "Keep the headline under 160 characters."),
  summary: z.string().max(800, "Keep the summary under 800 characters.").transform(blankToNull),
  tag: z.union([z.enum(NEWS_TOPICS), z.literal("")]).transform((value) => value || null),
});

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Validates the review form. Approving also needs a summary of at least 12 words and a topic. */
export function parseReview(
  form: FormData,
): { ok: true; review: Review } | { ok: false; message: string } {
  const intent = form.get("intent");
  const parsed = ReviewSchema.safeParse({
    id: form.get("id"),
    intent,
    // Rejecting ignores the edits, so a half-finished form can still be rejected.
    title: intent === "reject" ? "(rejected story)" : (form.get("title") ?? ""),
    summary: intent === "reject" ? "" : (form.get("summary") ?? ""),
    tag: intent === "reject" ? "" : (form.get("tag") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const review = parsed.data;
  if (review.intent === "approve") {
    if (!review.summary || wordCount(review.summary) < 12) {
      return { ok: false, message: "Write a summary of at least 12 words before approving." };
    }
    if (!review.tag) return { ok: false, message: "Pick a topic before approving." };
  }
  return { ok: true, review };
}

/** The columns a review changes. Rejecting takes a live story off the site. */
export function reviewUpdate(review: Review, now: Date) {
  const edits = { title: review.title, summary: review.summary, tag: review.tag };
  const updated_at = now.toISOString();
  switch (review.intent) {
    case "approve":
      return { ...edits, status: "approved", approved_at: updated_at, updated_at };
    case "reject":
      return { status: "rejected", approved_at: null, updated_at };
    case "save":
      return { ...edits, updated_at };
  }
}
