import type { Metadata } from "next";
import { seoMetadata } from "@/features/seo";
import { getLatestNews, NewsPage } from "@/features/news";

export const metadata: Metadata = seoMetadata({
  title: "AI News today, in plain English",
  description:
    "The day's AI news in plain English: new models, tools, research and policy, picked and summarised for developers and students. Every story links to its source.",
  path: "/news",
});

/* Prerendered from cached data; refreshed hourly and whenever a story is approved. */
export const ensureStatic = "navigation";

export default async function Page() {
  return <NewsPage items={await getLatestNews()} />;
}
