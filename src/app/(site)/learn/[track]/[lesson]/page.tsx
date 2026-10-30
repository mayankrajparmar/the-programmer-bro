import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLesson,
  getLessonParams,
  LESSON_SHARE_ALT,
  LessonPage,
  shareCardImage,
} from "@/features/learn";
import { seoMetadata } from "@/features/seo";

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
  const { frontmatter } = lesson;
  return {
    ...seoMetadata({
      title: lesson.title,
      description: frontmatter.description,
      path: lesson.href,
      type: "article",
      publishedTime: frontmatter.published ?? frontmatter.lastReviewed,
      modifiedTime: lesson.lastModified ?? frontmatter.lastReviewed,
      image: shareCardImage(lesson, LESSON_SHARE_ALT),
    }),
    ...(frontmatter.draft && { robots: { index: false, follow: false } }),
  };
}

export default async function Page({ params }: PageProps<"/learn/[track]/[lesson]">) {
  const { track, lesson: slug } = await params;
  const lesson = getLesson(track, slug);
  if (!lesson) notFound();
  return <LessonPage lesson={lesson} />;
}
