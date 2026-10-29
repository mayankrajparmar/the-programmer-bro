import "server-only";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { showInternalPages } from "@/config/site-mode";
import { readingMinutes, splitFrontmatter } from "@/lib/mdx";
import {
  ComingNextSchema,
  LessonFrontmatterSchema,
  QuizSchema,
  TrackSchema,
  type LessonFrontmatter,
  type Level,
  type Quiz,
  type UpcomingTrack,
} from "../schema";

/*
 * Reads the learning content from content/ at build time:
 *
 *   content/learn/<track>/track.json      the track's lesson plan, in order
 *   content/learn/<track>/NN-<slug>.mdx   a written lesson (NN = its number in the plan)
 *   content/quizzes/<slug>.json           the lesson's quiz
 *
 * A planned lesson without a file shows as "coming soon". Drafts (draft: true)
 * show on local and preview builds only. Any invalid file throws, failing the build.
 */

export interface LessonSummary {
  trackSlug: string;
  slug: string;
  title: string;
  summary: string;
  /** Position in the track, from 1. */
  number: number;
  module: { id: string; title: string };
  href: string;
  /** Written, and visible in this build. */
  published: boolean;
  draft: boolean;
  readingMinutes: number | null;
}

export interface Track {
  slug: string;
  title: string;
  description: string;
  level: Level;
  href: string;
  modules: { id: string; title: string; lessons: LessonSummary[] }[];
  lessons: LessonSummary[];
}

export interface Lesson extends LessonSummary {
  track: Pick<Track, "slug" | "title" | "level" | "href">;
  total: number;
  frontmatter: LessonFrontmatter;
  body: string;
  quiz: Quiz;
  previous: LessonSummary | null;
  next: LessonSummary | null;
}

export class ContentError extends Error {
  constructor(file: string, message: string) {
    super(`${path.relative(process.cwd(), file)}: ${message}`);
    this.name = "ContentError";
  }
}

const CONTENT_ROOT = path.join(process.cwd(), "content");
const LEARN_DIR = path.join(CONTENT_ROOT, "learn");
const QUIZ_DIR = path.join(CONTENT_ROOT, "quizzes");
const LESSON_FILE = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx$/;

function parseWith<T extends z.ZodType>(schema: T, data: unknown, file: string): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(file)"}: ${issue.message}`)
      .join("; ");
    throw new ContentError(file, issues);
  }
  return result.data;
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new ContentError(file, `not valid JSON (${(error as Error).message})`);
  }
}

interface LessonFile {
  file: string;
  frontmatter: LessonFrontmatter;
  body: string;
  quiz: Quiz;
}

function readLessonFile(file: string, slug: string): LessonFile {
  const { data, body } = splitFrontmatter(readFileSync(file, "utf8"));
  const frontmatter = parseWith(LessonFrontmatterSchema, data, file);

  const quizFile = path.join(QUIZ_DIR, `${slug}.json`);
  if (!existsSync(quizFile)) {
    throw new ContentError(file, `every lesson needs a quiz: add content/quizzes/${slug}.json`);
  }
  const quiz = parseWith(QuizSchema, readJson(quizFile), quizFile);
  if (quiz.lesson !== slug) {
    throw new ContentError(quizFile, `"lesson" is "${quiz.lesson}" but should be "${slug}"`);
  }

  return { file, frontmatter, body, quiz };
}

interface LoadedTrack {
  track: Track;
  files: Map<string, LessonFile>;
}

function loadTrack(trackSlug: string, includeDrafts: boolean): LoadedTrack {
  const dir = path.join(LEARN_DIR, trackSlug);
  const planFile = path.join(dir, "track.json");
  const plan = parseWith(TrackSchema, readJson(planFile), planFile);
  if (plan.slug !== trackSlug) {
    throw new ContentError(planFile, `slug is "${plan.slug}" but the folder is "${trackSlug}"`);
  }

  const planned = plan.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, module: { id: module.id, title: module.title } })),
  );

  const files = new Map<string, LessonFile>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".mdx")) continue;
    const file = path.join(dir, name);
    const match = LESSON_FILE.exec(name);
    if (!match) throw new ContentError(file, "name lesson files NN-slug.mdx, e.g. 05-tokens.mdx");
    const [, number, slug] = match as unknown as [string, string, string];
    const position = planned.findIndex((lesson) => lesson.slug === slug) + 1;
    if (position === 0) {
      throw new ContentError(
        file,
        `"${slug}" isn't in ${trackSlug}/track.json; add it to the plan`,
      );
    }
    if (Number(number) !== position) {
      throw new ContentError(
        file,
        `"${slug}" is lesson ${position} in the plan, so name it ${String(position).padStart(2, "0")}-${slug}.mdx`,
      );
    }
    files.set(slug, readLessonFile(file, slug));
  }

  const href = `/learn/${plan.slug}`;
  const lessons: LessonSummary[] = planned.map((lesson, index) => {
    const written = files.get(lesson.slug);
    const draft = written?.frontmatter.draft ?? false;
    return {
      trackSlug: plan.slug,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      number: index + 1,
      module: lesson.module,
      href: `${href}/${lesson.slug}`,
      published: Boolean(written) && (!draft || includeDrafts),
      draft,
      readingMinutes: written ? readingMinutes(written.body) : null,
    };
  });

  return {
    files,
    track: {
      slug: plan.slug,
      title: plan.title,
      description: plan.description,
      level: plan.level,
      href,
      lessons,
      modules: plan.modules.map((module) => ({
        id: module.id,
        title: module.title,
        lessons: lessons.filter((lesson) => lesson.module.id === module.id),
      })),
    },
  };
}

/* Content is read once per build. In development it's re-read so edits show on refresh. */
const cache = new Map<string, LoadedTrack>();
const shouldCache = process.env.NODE_ENV !== "development";

function loaded(trackSlug: string, includeDrafts = showInternalPages): LoadedTrack | null {
  if (!existsSync(path.join(LEARN_DIR, trackSlug, "track.json"))) return null;
  const key = `${trackSlug}:${includeDrafts}`;
  const hit = shouldCache ? cache.get(key) : undefined;
  if (hit) return hit;
  const result = loadTrack(trackSlug, includeDrafts);
  if (shouldCache) cache.set(key, result);
  return result;
}

/**
 * Tracks planned after the current ones, for "Coming next" on the home page. A track that
 * already has a folder in content/learn fails the build, so the list can't go stale.
 */
export function getUpcomingTracks(): UpcomingTrack[] {
  const file = path.join(LEARN_DIR, "coming-next.json");
  if (!existsSync(file)) return [];
  const { tracks } = parseWith(ComingNextSchema, readJson(file), file);
  const written = new Set(getTracks().map((track) => track.title.toLowerCase()));
  for (const track of tracks) {
    if (written.has(track.title.toLowerCase())) {
      throw new ContentError(file, `"${track.title}" is already a track; remove it from this list`);
    }
  }
  return tracks;
}

export function getTrackSlugs(): string[] {
  if (!existsSync(LEARN_DIR)) return [];
  return readdirSync(LEARN_DIR, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && existsSync(path.join(LEARN_DIR, entry.name, "track.json")),
    )
    .map((entry) => entry.name)
    .sort();
}

export function getTracks(): Track[] {
  return getTrackSlugs().flatMap((slug) => loaded(slug)?.track ?? []);
}

export function getTrack(slug: string): Track | null {
  return loaded(slug)?.track ?? null;
}

/** A published lesson with its content and quiz, or null if it isn't visible in this build. */
export function getLesson(trackSlug: string, lessonSlug: string): Lesson | null {
  const result = loaded(trackSlug);
  if (!result) return null;
  const { track, files } = result;
  const index = track.lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  const summary = track.lessons[index];
  const file = files.get(lessonSlug);
  if (!summary?.published || !file) return null;

  return {
    ...summary,
    track: { slug: track.slug, title: track.title, level: track.level, href: track.href },
    total: track.lessons.length,
    frontmatter: file.frontmatter,
    body: file.body,
    quiz: file.quiz,
    previous: track.lessons[index - 1] ?? null,
    next: track.lessons[index + 1] ?? null,
  };
}

/** Every lesson visible in this build. */
export function getPublishedLessons(): LessonSummary[] {
  return getTracks().flatMap((track) => track.lessons.filter((lesson) => lesson.published));
}

/**
 * Params for every planned lesson, for generateStaticParams. Lessons that aren't
 * visible in this build (not written yet, or drafts in production) prerender as
 * a static 404. Listing the whole plan also keeps the list from ever being empty,
 * which Cache Components doesn't allow: production has no visible lessons while
 * every lesson is still a draft.
 */
export function getLessonParams(): { track: string; lesson: string }[] {
  return getTracks().flatMap((track) =>
    track.lessons.map((lesson) => ({ track: track.slug, lesson: lesson.slug })),
  );
}

/** Public, indexable learn pages for the sitemap: never drafts. */
export function getLearnRoutes(): string[] {
  return getTrackSlugs().flatMap((slug) => {
    const track = loaded(slug, false)?.track;
    if (!track) return [];
    return [track.href, ...track.lessons.filter((l) => l.published).map((l) => l.href)];
  });
}
