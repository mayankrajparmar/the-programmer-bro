import { lessonKey } from "../progress/progress-store";
import type { Track } from "../server/content";
import { ContinueLearningCard } from "./continue-learning-card";

/** The home page's "Start here" / "Continue learning" card for one track. */
export function ContinueLearning({ track, className }: { track: Track; className?: string }) {
  return (
    <ContinueLearningCard
      className={className}
      track={{
        title: track.title,
        level: track.level,
        href: track.href,
        moduleCount: track.modules.length,
        lessons: track.lessons.map((lesson) => ({
          key: lessonKey(track.slug, lesson.slug),
          number: lesson.number,
          title: lesson.title,
          href: lesson.href,
          published: lesson.published,
        })),
      }}
    />
  );
}
