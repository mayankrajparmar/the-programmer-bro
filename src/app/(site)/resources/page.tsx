import type { Metadata } from "next";
import { seoMetadata } from "@/features/seo";
import { getResources, ResourcesPage } from "@/features/resources";

export const metadata: Metadata = seoMetadata({
  title: "Free AI resources: courses, videos, papers and tools",
  description:
    "Hand-picked AI courses, videos, papers, tools and books, from beginner to expert, each paired with a lesson.",
  path: "/resources",
});

/* Built once from content/resources.json; nothing here varies per request. */
export const ensureStatic = "navigation";

export default function Page() {
  return <ResourcesPage resources={getResources()} />;
}
