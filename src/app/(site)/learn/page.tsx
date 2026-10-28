import type { Metadata } from "next";
import { getTracks, LearnPage } from "@/features/learn";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Free AI lessons in plain English, from the basics to expert level, each with a quiz.",
  alternates: { canonical: "/learn" },
};

export default function Page() {
  return <LearnPage tracks={getTracks()} />;
}
