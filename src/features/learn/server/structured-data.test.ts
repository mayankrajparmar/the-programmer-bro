import { describe, expect, it } from "vitest";
import { getLesson, getTrack } from "./content";
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
      datePublished: lesson.frontmatter.published,
      dateModified: lesson.lastModified,
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
