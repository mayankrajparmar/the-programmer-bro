/*
 * Learning progress, kept in this browser until accounts arrive in Stage 2
 * (which merge it into the account on first sign-in). One versioned key, and
 * every read and write is wrapped so private browsing and blocked storage
 * simply mean "no saved progress".
 */

export const PROGRESS_KEY = "tpb:progress:v1";
const CHANGE_EVENT = "tpb:progress";

export interface LessonProgress {
  /** Best quiz score so far, and the number of questions it was out of. */
  bestScore: number;
  total: number;
  attempts: number;
  /** When the quiz was first finished (ISO date-time). */
  completedAt: string;
}

export interface Progress {
  version: 1;
  /** Keyed by "<track>/<lesson>". */
  lessons: Record<string, LessonProgress>;
}

export const EMPTY_PROGRESS: Progress = Object.freeze({ version: 1, lessons: Object.freeze({}) });

export const lessonKey = (trackSlug: string, lessonSlug: string) => `${trackSlug}/${lessonSlug}`;

function isLessonProgress(value: unknown): value is LessonProgress {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.bestScore === "number" &&
    typeof v.total === "number" &&
    typeof v.attempts === "number" &&
    typeof v.completedAt === "string"
  );
}

/** Parses stored progress, dropping anything malformed instead of failing. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const data = JSON.parse(raw) as { version?: unknown; lessons?: unknown };
    if (data.version !== 1 || typeof data.lessons !== "object" || data.lessons === null) {
      return EMPTY_PROGRESS;
    }
    const lessons = Object.fromEntries(
      Object.entries(data.lessons).filter(([, value]) => isLessonProgress(value)),
    ) as Record<string, LessonProgress>;
    return { version: 1, lessons };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(PROGRESS_KEY);
  } catch {
    return null;
  }
}

/* useSyncExternalStore needs the same object back while nothing has changed. */
let lastRaw: string | null | undefined;
let lastProgress: Progress = EMPTY_PROGRESS;

export function readProgress(): Progress {
  const raw = readRaw();
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastProgress = parseProgress(raw);
  }
  return lastProgress;
}

/** Adds a finished quiz attempt, keeping the best score and the first completion time. */
export function withQuizResult(
  progress: Progress,
  key: string,
  score: number,
  total: number,
  now: Date,
): Progress {
  const previous = progress.lessons[key];
  const next: LessonProgress = previous
    ? {
        bestScore: Math.max(previous.bestScore, score),
        total,
        attempts: previous.attempts + 1,
        completedAt: previous.completedAt,
      }
    : { bestScore: score, total, attempts: 1, completedAt: now.toISOString() };
  return { version: 1, lessons: { ...progress.lessons, [key]: next } };
}

export function recordQuizResult(key: string, score: number, total: number): void {
  const updated = withQuizResult(readProgress(), key, score, total, new Date());
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  } catch {
    // Storage blocked or full: the result still shows, it just isn't remembered.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Notifies on changes from this tab (CHANGE_EVENT) and from other tabs (storage). */
export function subscribeToProgress(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === PROGRESS_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
