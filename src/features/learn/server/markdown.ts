import { absoluteUrl } from "@/features/seo";
import { DIAGRAM_MARKDOWN } from "../diagrams/text";
import type { Lesson } from "./content";

/*
 * A lesson as plain Markdown, for AI tools that read llms-full.txt instead of the
 * page. The lesson's MDX components become their Markdown equivalents: callouts
 * become labelled quotes and diagrams become the text version of the figure.
 */

const quote = (label: string, text: string) =>
  `> **${label}**\n>\n${text
    .trim()
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n")}`;

const CALLOUT_LABELS: Record<string, string> = { note: "Note", tip: "Tip", warn: "Watch out" };

function attribute(attributes: string, name: string): string | undefined {
  return new RegExp(`${name}="([^"]*)"`).exec(attributes)?.[1];
}

/** Turns lesson MDX into Markdown. Throws if a component it doesn't know is left. */
export function mdxToMarkdown(body: string): string {
  const markdown = body
    .replace(
      /<Figure caption="([^"]*)">\s*([\s\S]*?)\s*<\/Figure>/g,
      (_, caption: string, inner: string) => {
        const name = /<(\w+Diagram)\s*\/>/.exec(inner)?.[1];
        const text = name ? DIAGRAM_MARKDOWN[name] : undefined;
        if (!text) throw new Error(`No Markdown version of the figure "${caption}"`);
        return `**${caption}**\n\n${text}`;
      },
    )
    .replace(/<Analogy>\s*([\s\S]*?)\s*<\/Analogy>/g, (_, text: string) =>
      quote("Think of it like this:", text),
    )
    .replace(/<TryIt>\s*([\s\S]*?)\s*<\/TryIt>/g, (_, text: string) => quote("Try it:", text))
    .replace(
      /<Callout([^>]*)>\s*([\s\S]*?)\s*<\/Callout>/g,
      (_, attributes: string, text: string) => {
        const label =
          attribute(attributes, "title") ?? CALLOUT_LABELS[attribute(attributes, "kind") ?? "note"];
        return quote(`${label ?? "Note"}:`, text);
      },
    )
    .replace(
      /<KeyTakeaways>\s*([\s\S]*?)\s*<\/KeyTakeaways>/g,
      (_, text: string) => `## Key takeaways\n\n${text.trim()}`,
    )
    .replace(/<sup>([^<]*)<\/sup>/g, "^$1")
    .trim();

  // Code samples may show HTML on purpose, so only check the prose.
  const prose = markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const leftover = /<\/?[A-Za-z][^>]*>/.exec(prose);
  if (leftover) throw new Error(`Can't turn ${leftover[0]} into Markdown`);
  return markdown;
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** The whole lesson as a Markdown document: header, summary, body and sources. */
export function lessonMarkdown(lesson: Lesson): string {
  const { frontmatter } = lesson;
  const reviewed = dateFormat.format(new Date(`${frontmatter.lastReviewed}T00:00:00Z`));
  return [
    `# ${lesson.title}`,
    [
      `URL: ${absoluteUrl(lesson.href)}`,
      `Lesson ${lesson.number} of ${lesson.total} in ${lesson.track.title} (${lesson.track.level}), about ${lesson.readingMinutes} minutes. Last reviewed ${reviewed}.`,
    ].join("\n"),
    `**In short:** ${frontmatter.inShort}`,
    mdxToMarkdown(lesson.body),
    [
      "## Sources and further reading",
      "",
      ...frontmatter.sources.map((source) => `- [${source.title}](${source.url}): ${source.note}`),
    ].join("\n"),
  ].join("\n\n");
}
