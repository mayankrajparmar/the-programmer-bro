import type { Metadata } from "next";
import { getResources, ResourcesPage } from "@/features/resources";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Hand-picked AI courses, videos, papers, tools and books, from beginner to expert, each paired with a lesson.",
  alternates: { canonical: "/resources" },
};

/* Built once from content/resources.json; nothing here varies per request. */
export const ensureStatic = "navigation";

export default function Page() {
  return <ResourcesPage resources={getResources()} />;
}
