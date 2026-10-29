"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/features/auth";
import { createServiceClient } from "@/lib/supabase/clients";
import { NEWS_CACHE_TAG } from "../server/news";
import { parseReview, reviewUpdate } from "./review";

export type ReviewState =
  { status: "idle" } | { status: "error"; message: string } | { status: "saved"; message: string };

/**
 * Approve, save or reject one story. Checks the admin first (never trust the page alone),
 * validates the form, writes with the service role, then refreshes every page that shows news.
 */
export async function reviewStory(_previous: ReviewState, form: FormData): Promise<ReviewState> {
  await requireAdmin();
  const parsed = parseReview(form);
  if (!parsed.ok) return { status: "error", message: parsed.message };
  const { review } = parsed;

  const db = createServiceClient();
  if (!db) return { status: "error", message: "The database isn't configured here." };

  const { data, error } = await db
    .from("news_items")
    .update(reviewUpdate(review, new Date()))
    .eq("id", review.id)
    .select("status")
    .maybeSingle();
  if (error) return { status: "error", message: `Couldn't save: ${error.message}` };
  if (!data) return { status: "error", message: "That story no longer exists." };

  if (review.intent !== "save" || data.status === "approved") {
    // The News page (and later the home page) show this story: rebuild them on the next visit.
    updateTag(NEWS_CACHE_TAG);
  } else {
    refresh();
  }
  return { status: "saved", message: review.intent === "save" ? "Saved." : "Done." };
}

/** Turns a source back on after the job switched it off for failing. */
export async function turnSourceOn(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const db = createServiceClient();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await db
    .from("news_sources")
    .update({ active: true, consecutive_failures: 0, last_error: null })
    .eq("id", id);
  refresh();
}
