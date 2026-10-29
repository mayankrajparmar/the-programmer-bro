import type { Metadata } from "next";
import { getLatestNews, NewsPage } from "@/features/news";

export const metadata: Metadata = {
  title: "AI News",
  description:
    "The day's AI news in plain English, picked and summarised for developers and students in India. Every story links to its source.",
  alternates: { canonical: "/news" },
};

/* Prerendered from cached data; refreshed hourly and whenever a story is approved. */
export const ensureStatic = "navigation";

export default async function Page() {
  return <NewsPage items={await getLatestNews()} />;
}
