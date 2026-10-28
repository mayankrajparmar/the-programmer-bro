import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLesson, getLessonParams, LessonPage } from "@/features/learn";

/*
 * Lessons are fully static. This also makes an unknown slug wait for its
 * render, so it gets a real 404 status instead of a streamed fallback.
 */
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return getLessonParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/[track]/[lesson]">): Promise<Metadata> {
  const { track, lesson: slug } = await params;
  const lesson = getLesson(track, slug);
  if (!lesson) return {};
  return {
    title: lesson.title,
    description: lesson.frontmatter.description,
    alternates: { canonical: lesson.href },
    openGraph: { type: "article", url: lesson.href, title: lesson.title },
    ...(lesson.frontmatter.draft && { robots: { index: false, follow: false } }),
  };
}

export default async function Page({ params }: PageProps<"/learn/[track]/[lesson]">) {
  const { track, lesson: slug } = await params;
  const lesson = getLesson(track, slug);
  if (!lesson) notFound();
  return <LessonPage lesson={lesson} />;
}
