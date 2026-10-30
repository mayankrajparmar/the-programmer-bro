import "server-only";
import { site } from "@/config/site";
import { getLesson, getPublishedLessons, lessonMarkdown, type Lesson } from "@/features/learn";
import { getPage, PAGE_SLUGS } from "@/features/pages";
import { absoluteUrl } from "@/features/seo";

/*
 * llms.txt (https://llmstxt.org): a short Markdown map of the site for AI tools,
 * and llms-full.txt with the full text of every published lesson, so an assistant
 * can read and quote a lesson without parsing the page. Drafts never appear.
 */

function publishedLessons(): Lesson[] {
  return getPublishedLessons().flatMap((summary) => {
    const lesson = getLesson(summary.trackSlug, summary.slug);
    return lesson && !lesson.frontmatter.draft ? [lesson] : [];
  });
}

const link = (title: string, path: string, about: string) =>
  `- [${title}](${absoluteUrl(path)}): ${about}`;

const ABOUT_SITE = [
  `${site.name} (${absoluteUrl("/")}) is a free website for learning how AI really works.`,
  "Lessons are short, written in simple English with everyday examples, and each ends with a quiz and a list of the sources it was checked against.",
  `A person reviews every lesson and news summary before it is published. Questions and corrections: ${site.contactEmail}.`,
].join(" ");

export function llmsTxt(): string {
  const lessons = publishedLessons();
  return [
    `# ${site.name}`,
    `> ${site.description}`,
    ABOUT_SITE,
    [
      "## Lessons",
      "",
      ...lessons.map((lesson) =>
        link(
          `${lesson.track.title}, lesson ${lesson.number}: ${lesson.title}`,
          lesson.href,
          lesson.frontmatter.inShort,
        ),
      ),
    ].join("\n"),
    [
      "## Sections",
      "",
      link("Learn", "/learn", "Every track and lesson, from the basics to expert level."),
      link(
        "AI News",
        "/news",
        "The day's AI news in plain English, each story linked to its source.",
      ),
      link("Resources", "/resources", "Hand-picked AI courses, videos, papers, tools and books."),
    ].join("\n"),
    [
      "## About this site",
      "",
      ...PAGE_SLUGS.map((slug) => {
        const { frontmatter } = getPage(slug);
        return link(frontmatter.title, `/${slug}`, frontmatter.description);
      }),
    ].join("\n"),
    [
      "## Optional",
      "",
      link(
        "Full text of every lesson",
        "/llms-full.txt",
        "All published lessons as Markdown, with their sources.",
      ),
    ].join("\n"),
  ]
    .join("\n\n")
    .concat("\n");
}

export function llmsFullTxt(): string {
  return [
    `# ${site.name}: every lesson in full`,
    `> ${site.description}`,
    ABOUT_SITE,
    ...publishedLessons().map(lessonMarkdown),
  ]
    .join("\n\n---\n\n")
    .concat("\n");
}
