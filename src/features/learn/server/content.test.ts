import { describe, expect, it } from "vitest";
import { ComingNextSchema, QuizSchema, TrackSchema } from "../schema";
import {
  getLearnRoutes,
  getLearnSitemapEntries,
  getLesson,
  getLessonParams,
  getPublishedLessons,
  getTrack,
  getTracks,
  getUpcomingTracks,
} from "./content";

/*
 * Runs the real content in content/ through the same loader the build uses,
 * plus the checks that can't run at build time (dates against today).
 */
describe("learning content", () => {
  const tracks = getTracks();

  it("loads every track without errors", () => {
    expect(tracks.length).toBeGreaterThan(0);
  });

  it("numbers lessons 1..n with no gaps", () => {
    for (const track of tracks) {
      expect(track.lessons.map((lesson) => lesson.number)).toEqual(
        track.lessons.map((_, i) => i + 1),
      );
    }
  });

  it("has a quiz and a reading time for every written lesson", () => {
    for (const summary of getPublishedLessons()) {
      const lesson = getLesson(summary.trackSlug, summary.slug);
      expect(lesson, summary.href).not.toBeNull();
      expect(lesson?.quiz.questions.length).toBeGreaterThanOrEqual(5);
      expect(summary.readingMinutes).toBeGreaterThan(0);
    }
  });

  it("never dates a review or a publication in the future", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const summary of getPublishedLessons()) {
      const lesson = getLesson(summary.trackSlug, summary.slug);
      expect((lesson?.frontmatter.lastReviewed ?? "") <= today, summary.href).toBe(true);
      expect((lesson?.frontmatter.published ?? "") <= today, summary.href).toBe(true);
    }
  });

  it("gives published lessons a publication date", () => {
    for (const summary of getPublishedLessons().filter((lesson) => !lesson.draft)) {
      const lesson = getLesson(summary.trackSlug, summary.slug);
      expect(lesson?.frontmatter.published, summary.href).toBeTruthy();
    }
  });

  it("always has lesson params to prerender, even before any lesson is published", () => {
    // Cache Components fails the build when generateStaticParams returns nothing.
    const params = getLessonParams();
    expect(params.length).toBe(tracks.reduce((sum, track) => sum + track.lessons.length, 0));
    expect(params).toContainEqual({ track: "how-ai-works", lesson: "what-is-ai" });
  });

  it("dates each sitemap entry by its last change, and a track by its latest lesson", () => {
    const entries = getLearnSitemapEntries();
    const lesson = getLesson("how-ai-works", "what-is-ai");
    expect(lesson?.lastModified).toBe(
      [lesson?.frontmatter.lastReviewed, lesson?.frontmatter.published].sort().at(-1),
    );
    expect(entries).toContainEqual({
      path: "/learn/how-ai-works/what-is-ai",
      lastModified: lesson?.lastModified,
    });
    const track = entries.find((entry) => entry.path === "/learn/how-ai-works");
    const lessonDates = entries
      .filter((entry) => entry.path.startsWith("/learn/how-ai-works/"))
      .map((entry) => entry.lastModified ?? "");
    expect(track?.lastModified).toBe(lessonDates.sort().at(-1));
  });

  it("keeps drafts out of the sitemap", () => {
    const drafts = getPublishedLessons().filter((lesson) => lesson.draft);
    const routes = getLearnRoutes();
    for (const draft of drafts) expect(routes).not.toContain(draft.href);
  });

  it("returns null for lessons and tracks that don't exist", () => {
    expect(getTrack("no-such-track")).toBeNull();
    expect(getLesson("how-ai-works", "no-such-lesson")).toBeNull();
    expect(getLesson("how-ai-works", "neural-networks")).toBeNull(); // planned, not written yet
  });

  it("lists the tracks coming next, none of which exist yet", () => {
    const upcoming = getUpcomingTracks();
    expect(upcoming.length).toBeGreaterThan(0);
    const titles = new Set(tracks.map((track) => track.title));
    expect(upcoming.filter((track) => titles.has(track.title))).toEqual([]);
  });

  it("only allows the site's levels, or All levels, for upcoming tracks", () => {
    const parse = (level: string) =>
      ComingNextSchema.safeParse({ tracks: [{ title: "A track", level }] }).success;
    expect(parse("All levels")).toBe(true);
    expect(parse("Expert")).toBe(true);
    expect(parse("Ninja")).toBe(false);
  });

  it("links each lesson to its neighbours", () => {
    const lesson = getLesson("how-ai-works", "what-is-ai");
    expect(lesson?.previous).toBeNull();
    expect(lesson?.next?.slug).toBe("history");
    expect(lesson?.total).toBe(16);

    const second = getLesson("how-ai-works", "history");
    expect(second?.number).toBe(2);
    expect(second?.previous?.slug).toBe("what-is-ai");
    expect(second?.next?.slug).toBe("meet-the-llm");

    const third = getLesson("how-ai-works", "meet-the-llm");
    expect(third?.number).toBe(3);
    expect(third?.previous?.slug).toBe("history");
    expect(third?.next?.slug).toBe("next-word");

    const fourth = getLesson("how-ai-works", "next-word");
    expect(fourth?.number).toBe(4);
    expect(fourth?.previous?.slug).toBe("meet-the-llm");
    expect(fourth?.next?.slug).toBe("tokens");

    const fifth = getLesson("how-ai-works", "tokens");
    expect(fifth?.number).toBe(5);
    expect(fifth?.previous?.slug).toBe("next-word");
    expect(fifth?.next?.slug).toBe("search-vs-llm");

    const sixth = getLesson("how-ai-works", "search-vs-llm");
    expect(sixth?.number).toBe(6);
    expect(sixth?.previous?.slug).toBe("tokens");
    expect(sixth?.next?.slug).toBe("embeddings");

    const seventh = getLesson("how-ai-works", "embeddings");
    expect(seventh?.number).toBe(7);
    expect(seventh?.previous?.slug).toBe("search-vs-llm");
    expect(seventh?.next?.slug).toBe("rag");

    const eighth = getLesson("how-ai-works", "rag");
    expect(eighth?.number).toBe(8);
    expect(eighth?.previous?.slug).toBe("embeddings");
    expect(eighth?.next?.slug).toBe("neural-networks");
  });
});

const question = (id: string, type: "recall" | "application") => ({
  id,
  type,
  prompt: "Which of these is true?",
  options: ["a", "b", "c", "d"],
  answer: 0,
  explanation: "Because the lesson says so, clearly.",
});

describe("quiz rules", () => {
  const valid = {
    lesson: "x",
    questions: [
      question("q1", "recall"),
      question("q2", "recall"),
      question("q3", "recall"),
      question("q4", "application"),
      question("q5", "application"),
    ],
  };

  it("accepts a well-formed quiz", () => {
    expect(QuizSchema.safeParse(valid).success).toBe(true);
  });

  it("needs 5 to 8 questions", () => {
    expect(QuizSchema.safeParse({ ...valid, questions: valid.questions.slice(0, 4) }).success).toBe(
      false,
    );
  });

  it("needs four options and an answer from 0 to 3", () => {
    const [first, ...rest] = valid.questions;
    const three = { ...first, options: ["a", "b", "c"] };
    const outOfRange = { ...first, answer: 4 };
    expect(QuizSchema.safeParse({ ...valid, questions: [three, ...rest] }).success).toBe(false);
    expect(QuizSchema.safeParse({ ...valid, questions: [outOfRange, ...rest] }).success).toBe(
      false,
    );
  });

  it("needs at least two application questions", () => {
    const recallOnly = valid.questions.map((q) => ({ ...q, type: "recall" }));
    const result = QuizSchema.safeParse({ ...valid, questions: recallOnly });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/application/);
  });

  it("rejects duplicate lesson slugs in a track plan", () => {
    const lesson = { slug: "same", title: "T", summary: "S" };
    const result = TrackSchema.safeParse({
      slug: "t",
      title: "T",
      description: "D",
      level: "Beginner",
      modules: [{ id: "A", title: "M", lessons: [lesson, lesson] }],
    });
    expect(result.success).toBe(false);
  });
});
