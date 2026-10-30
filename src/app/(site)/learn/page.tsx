import type { Metadata } from "next";
import { seoMetadata } from "@/features/seo";
import { getTracks, LearnPage } from "@/features/learn";

export const metadata: Metadata = seoMetadata({
  title: "Learn AI for free",
  description:
    "Free AI lessons in plain English, from the basics to expert level, each with a quiz. Start with How AI Works.",
  path: "/learn",
});

export default function Page() {
  return <LearnPage tracks={getTracks()} />;
}
