import { z } from "zod";
import { LEVELS, type Level } from "@/config/levels";

/*
 * The shape of every file under content/learn and content/quizzes. Content is
 * validated when it's loaded at build, so a bad file fails the build with a
 * clear message instead of breaking a page.
 */

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase words joined by hyphens");

export const TrackSchema = z
  .object({
    $comment: z.string().optional(),
    slug,
    title: z.string().min(1),
    description: z.string().min(1),
    level: z.enum(LEVELS),
    modules: z
      .array(
        z
          .object({
            id: z.string().regex(/^[A-Z]$/, "use a single capital letter"),
            title: z.string().min(1),
            lessons: z
              .array(
                z.object({ slug, title: z.string().min(1), summary: z.string().min(1) }).strict(),
              )
              .min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((track, ctx) => {
    const seen = new Set<string>();
    for (const lesson of track.modules.flatMap((module) => module.lessons)) {
      if (seen.has(lesson.slug)) {
        ctx.addIssue({ code: "custom", message: `Lesson slug "${lesson.slug}" is used twice` });
      }
      seen.add(lesson.slug);
    }
  });

export const SOURCE_TYPES = [
  "Article",
  "Paper",
  "Docs",
  "Video",
  "Course",
  "GitHub",
  "Book",
] as const;

export const LessonFrontmatterSchema = z
  .object({
    /** Meta description for search results and link previews. */
    description: z.string().min(50).max(160),
    /** The "In short" summary at the top of the lesson. */
    inShort: z.string().min(20).max(300),
    /** When a person last checked the lesson for accuracy (YYYY-MM-DD). */
    lastReviewed: z.iso.date(),
    /** Drafts show on local and preview builds only, never in production. */
    draft: z.boolean().default(false),
    /** The day it first went live (YYYY-MM-DD). Set it together with draft: false. */
    published: z.iso.date().optional(),
    sources: z
      .array(
        z
          .object({
            title: z.string().min(1),
            url: z.url({ protocol: /^https$/ }),
            type: z.enum(SOURCE_TYPES),
            note: z.string().min(1),
          })
          .strict(),
      )
      .min(1)
      .max(6),
  })
  .strict();

export const QuizSchema = z
  .object({
    lesson: slug,
    questions: z
      .array(
        z
          .object({
            id: slug,
            /** Recall checks a fact; application asks the learner to use it on a new case. */
            type: z.enum(["recall", "application"]),
            prompt: z.string().min(10),
            options: z.array(z.string().min(1)).length(4, "every question has four options"),
            answer: z.number().int().min(0).max(3),
            explanation: z.string().min(20),
          })
          .strict(),
      )
      .min(5, "a quiz has 5 to 8 questions")
      .max(8, "a quiz has 5 to 8 questions"),
  })
  .strict()
  .superRefine((quiz, ctx) => {
    const applied = quiz.questions.filter((question) => question.type === "application").length;
    if (applied < 2) {
      ctx.addIssue({ code: "custom", message: "a quiz needs at least two application questions" });
    }
    const ids = quiz.questions.map((question) => question.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "question ids must be unique" });
    }
  });

/** content/learn/coming-next.json: tracks that are planned but not written yet. */
export const ComingNextSchema = z
  .object({
    $comment: z.string().optional(),
    tracks: z
      .array(
        z
          .object({
            title: z.string().min(1),
            level: z.enum([...LEVELS, "All levels"]),
          })
          .strict(),
      )
      .max(12),
  })
  .strict();

export type TrackFile = z.infer<typeof TrackSchema>;
export type LessonFrontmatter = z.infer<typeof LessonFrontmatterSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type UpcomingTrack = z.infer<typeof ComingNextSchema>["tracks"][number];
export type QuizQuestion = Quiz["questions"][number];
export type Source = LessonFrontmatter["sources"][number];
export type { Level };
