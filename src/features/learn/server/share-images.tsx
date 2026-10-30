import "server-only";
import { renderShareImage, SHARE_IMAGE_SIZE } from "@/features/seo";
import { getLesson, getTrack, type LessonSummary, type Track } from "./content";

/*
 * Share cards for the learning section, served at <page>/card.png. Pages point their
 * Open Graph image and structured data at the same address.
 */

export const LESSON_SHARE_ALT =
  "A lesson card from The Programmer Bro: the lesson's title and where it sits in the track.";
export const TRACK_SHARE_ALT =
  "A course card from The Programmer Bro: the track's title, its level and how many lessons it has.";

export const shareCardPath = (page: Pick<LessonSummary | Track, "href">) => `${page.href}/card.png`;

/** Open Graph image metadata for a lesson or track page. */
export function shareCardImage(page: Pick<LessonSummary | Track, "href">, alt: string) {
  return { url: shareCardPath(page), ...SHARE_IMAGE_SIZE, alt };
}

const notFound = () => new Response("Not found", { status: 404 });

export async function lessonShareImage(trackSlug: string, lessonSlug: string): Promise<Response> {
  const lesson = getLesson(trackSlug, lessonSlug);
  if (!lesson) return notFound();
  return renderShareImage({
    eyebrow: `${lesson.track.title} · Lesson ${lesson.number} of ${lesson.total}`,
    title: lesson.title,
    summary: lesson.summary,
    chips: ["Free", `${lesson.readingMinutes} min read`, "Quiz included"],
  });
}

export async function trackShareImage(trackSlug: string): Promise<Response> {
  const track = getTrack(trackSlug);
  if (!track) return notFound();
  return renderShareImage({
    eyebrow: `Free course · ${track.level}`,
    title: track.title,
    summary: track.description,
    chips: [`${track.lessons.length} lessons`, "Quizzes", "Plain English"],
  });
}
