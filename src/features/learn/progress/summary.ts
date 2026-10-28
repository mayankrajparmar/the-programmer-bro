import type { Progress } from "./progress-store";

export interface ProgressLesson {
  /** "<track>/<lesson>", as stored in progress. */
  key: string;
  published: boolean;
}

export interface ProgressSummary {
  done: Set<string>;
  doneCount: number;
  /** The first published lesson not done yet, or null when every published lesson is done. */
  upNext: string | null;
}

/** How far through a track this browser is. A lesson is done once its quiz is finished. */
export function summarizeProgress(
  progress: Progress,
  lessons: readonly ProgressLesson[],
): ProgressSummary {
  const done = new Set(lessons.filter((l) => progress.lessons[l.key]).map((l) => l.key));
  const upNext = lessons.find((l) => l.published && !done.has(l.key))?.key ?? null;
  return { done, doneCount: done.size, upNext };
}
