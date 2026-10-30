import { describe, expect, it } from "vitest";
import { getLesson, getPublishedLessons, getTrack, getTracks } from "./content";
import { lessonJsonLd, trackJsonLd } from "./structured-data";

const node = (graph: { "@graph": Record<string, unknown>[] }, type: string) =>
  graph["@graph"].find((entry) =>
    ([] as unknown[]).concat(entry["@type"]).includes(type),
  ) as Record<string, unknown>;

describe("learning structured data", () => {
  it("describes a lesson as a reviewed article in its course, citing its sources", () => {
    const lesson = getLesson("how-ai-works", "what-is-ai");
    if (!lesson) throw new Error("lesson 1 is missing");
    const graph = lessonJsonLd(lesson);
    const article = node(graph, "Article");
    expect(article).toMatchObject({
      "@type": ["Article", "LearningResource"],
      headline: "What is AI, really?",
      url: "https://theprogrammerbro.in/learn/how-ai-works/what-is-ai",
      datePublished: `${lesson.frontmatter.published}T00:00:00+05:30`,
      dateModified: `${lesson.lastModified}T00:00:00+05:30`,
      isPartOf: { "@id": "https://theprogrammerbro.in/learn/how-ai-works#course" },
      position: 1,
    });
    expect(article.citation).toHaveLength(lesson.frontmatter.sources.length);
    expect(String(article.dateModified) >= String(article.datePublished)).toBe(true);
    expect(node(graph, "WebPage")).toMatchObject({
      lastReviewed: lesson.frontmatter.lastReviewed,
      reviewedBy: { "@id": "https://theprogrammerbro.in/#founder" },
    });
    expect(node(graph, "BreadcrumbList").itemListElement).toHaveLength(3);
  });

  it("describes a track as a free course listing its published lessons", () => {
    const track = getTrack("how-ai-works");
    if (!track) throw new Error("track is missing");
    const course = node(trackJsonLd(track), "Course");
    expect(course).toMatchObject({
      name: "How AI Works",
      isAccessibleForFree: true,
      provider: { "@id": "https://theprogrammerbro.in/#organization" },
    });
    expect(course.hasPart).toHaveLength(track.lessons.filter((l) => l.published).length);
  });
});

/*
 * Google's checks for the types it reads, so the Rich Results Test stays clean. A Course
 * needs a name and description, and a provider with a name (otherwise it warns). Course
 * markup belongs on the course's own page only.
 */
describe("Google's structured data rules", () => {
  const typed = (graph: { "@graph": Record<string, unknown>[] }, type: string) =>
    graph["@graph"].filter((entry) => ([] as unknown[]).concat(entry["@type"]).includes(type));

  it("puts a complete Course only on the track page", () => {
    for (const summary of getPublishedLessons()) {
      const lesson = getLesson(summary.trackSlug, summary.slug);
      if (!lesson) throw new Error(summary.href);
      expect(typed(lessonJsonLd(lesson), "Course"), summary.href).toEqual([]);
    }
    for (const track of getTracks()) {
      const courses = typed(trackJsonLd(track), "Course");
      expect(courses).toHaveLength(1);
      expect(courses[0]).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        provider: { "@type": "Organization", name: "The Programmer Bro" },
      });
    }
  });

  it("names each lesson's author and publisher inline", () => {
    const lesson = getLesson("how-ai-works", "history");
    if (!lesson) throw new Error("lesson 2 is missing");
    const [article] = typed(lessonJsonLd(lesson), "Article");
    for (const role of ["author", "publisher"]) {
      expect(article?.[role], role).toMatchObject({
        "@type": "Organization",
        name: "The Programmer Bro",
        url: "https://theprogrammerbro.in/",
      });
    }
  });
});
