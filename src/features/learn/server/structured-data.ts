import {
  absoluteUrl,
  breadcrumbNode,
  FOUNDER_ID,
  isoDateTime,
  jsonLdGraph,
  LANGUAGE,
  publisherRef,
  WEBSITE_ID,
  websiteNode,
  type JsonLdGraph,
  type JsonLdNode,
} from "@/features/seo";
import type { Lesson, Track } from "./content";
import { shareCardPath } from "./share-images";

/*
 * Structured data for the learning section: a track is a free online Course, and
 * each lesson is an Article that is also a LearningResource in that course. Lessons
 * list their sources as citations and say who reviewed them and when, which is what
 * answer engines look for when deciding what to quote.
 */

const courseId = (trackHref: string) => absoluteUrl(`${trackHref}#course`);

function pageNode(path: string, name: string, extra: Record<string, unknown> = {}): JsonLdNode {
  const url = absoluteUrl(path);
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    inLanguage: LANGUAGE,
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    ...extra,
  };
}

function trail(path: string, items: readonly { name: string; path: string }[]): JsonLdNode {
  return { ...breadcrumbNode(items), "@id": `${absoluteUrl(path)}#breadcrumb` };
}

export function lessonJsonLd(lesson: Lesson): JsonLdGraph {
  const { frontmatter } = lesson;
  const url = absoluteUrl(lesson.href);
  const published = frontmatter.published ?? frontmatter.lastReviewed;

  const article: JsonLdNode = {
    "@type": ["Article", "LearningResource"],
    "@id": `${url}#lesson`,
    headline: lesson.title,
    name: lesson.title,
    description: frontmatter.description,
    abstract: frontmatter.inShort,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    image: absoluteUrl(shareCardPath(lesson)),
    inLanguage: LANGUAGE,
    isAccessibleForFree: true,
    learningResourceType: "Lesson",
    educationalLevel: lesson.track.level,
    ...(lesson.readingMinutes && { timeRequired: `PT${lesson.readingMinutes}M` }),
    position: lesson.number,
    // A reference only: the full Course lives on the track page. A Course node here
    // would be read as a second, incomplete course and fail Google's checks.
    isPartOf: { "@id": courseId(lesson.track.href) },
    author: publisherRef(),
    publisher: publisherRef(),
    datePublished: isoDateTime(published),
    dateModified: isoDateTime(lesson.lastModified ?? frontmatter.lastReviewed),
    citation: frontmatter.sources.map((source) => ({
      "@type": "CreativeWork",
      name: source.title,
      url: source.url,
    })),
  };

  return jsonLdGraph(
    pageNode(lesson.href, lesson.title, {
      lastReviewed: frontmatter.lastReviewed,
      reviewedBy: { "@id": FOUNDER_ID },
      mainEntity: { "@id": `${url}#lesson` },
    }),
    article,
    trail(lesson.href, [
      { name: "Learn", path: "/learn" },
      { name: lesson.track.title, path: lesson.track.href },
      { name: lesson.title, path: lesson.href },
    ]),
    websiteNode(),
  );
}

export function trackJsonLd(track: Track): JsonLdGraph {
  const published = track.lessons.filter((lesson) => lesson.published);
  return jsonLdGraph(
    pageNode(track.href, track.title, { mainEntity: { "@id": courseId(track.href) } }),
    {
      "@type": "Course",
      "@id": courseId(track.href),
      name: track.title,
      description: track.description,
      url: absoluteUrl(track.href),
      image: absoluteUrl(shareCardPath(track)),
      provider: publisherRef(),
      inLanguage: LANGUAGE,
      educationalLevel: track.level,
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: 0, priceCurrency: "INR", category: "Free" },
      hasPart: published.map((lesson) => ({
        "@type": "LearningResource",
        "@id": absoluteUrl(`${lesson.href}#lesson`),
        name: lesson.title,
        url: absoluteUrl(lesson.href),
        position: lesson.number,
      })),
    },
    trail(track.href, [
      { name: "Learn", path: "/learn" },
      { name: track.title, path: track.href },
    ]),
    websiteNode(),
  );
}
