/*
 * News topics, in the order the filter chips show them. The ingest job imports
 * this file directly with Node, so it must stay free of imports and path aliases.
 * The database checks the same list (supabase/migrations/0001_news.sql).
 */

export const NEWS_TOPICS = ["models", "tools", "research", "policy", "india"] as const;

export type NewsTopic = (typeof NEWS_TOPICS)[number];

export const TOPIC_LABELS: Record<NewsTopic, string> = {
  models: "Models",
  tools: "Tools",
  research: "Research",
  policy: "Policy",
  india: "India",
};

export function isNewsTopic(value: unknown): value is NewsTopic {
  return typeof value === "string" && (NEWS_TOPICS as readonly string[]).includes(value);
}
