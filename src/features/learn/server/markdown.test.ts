import { describe, expect, it } from "vitest";
import { lessonComponents } from "../components/mdx-components";
import { DIAGRAM_MARKDOWN } from "../diagrams/text";
import { getLesson, getPublishedLessons } from "./content";
import { lessonMarkdown, mdxToMarkdown } from "./markdown";

describe("lesson Markdown", () => {
  it("turns callouts, figures and takeaways into Markdown", () => {
    const markdown = mdxToMarkdown(
      [
        "Intro with 10<sup>170</sup> positions.",
        "<Analogy>\n\nLike a mango.\n\n</Analogy>",
        '<Callout kind="warn">\n\nCareful.\n\n</Callout>',
        "<TryIt>\n\nDo this.\n\n</TryIt>",
        '<Figure caption="Figure 1: sizes.">\n  <LlmSizesDiagram />\n</Figure>',
        "<KeyTakeaways>\n\n- One.\n\n</KeyTakeaways>",
      ].join("\n\n"),
    );
    expect(markdown).toContain("10^170 positions");
    expect(markdown).toContain("> **Think of it like this:**\n>\n> Like a mango.");
    expect(markdown).toContain("> **Watch out:**\n>\n> Careful.");
    expect(markdown).toContain("> **Try it:**");
    expect(markdown).toContain(
      "**Figure 1: sizes.**\n\n- GPT-2 (OpenAI, 2019): 1.5 billion parameters",
    );
    expect(markdown).toContain("## Key takeaways\n\n- One.");
  });

  it("refuses components it can't convert", () => {
    expect(() => mdxToMarkdown("<Mystery>hi</Mystery>")).toThrow(/Mystery/);
  });

  it("has a text version of every diagram lessons can use", () => {
    const diagrams = Object.keys(lessonComponents).filter((name) => name.endsWith("Diagram"));
    expect(diagrams.length).toBeGreaterThan(0);
    for (const name of diagrams) expect(DIAGRAM_MARKDOWN[name], name).toBeTruthy();
  });

  it("converts every written lesson, with its summary and sources", () => {
    for (const summary of getPublishedLessons()) {
      const lesson = getLesson(summary.trackSlug, summary.slug);
      if (!lesson) throw new Error(summary.href);
      const markdown = lessonMarkdown(lesson);
      expect(markdown.startsWith(`# ${lesson.title}\n`)).toBe(true);
      expect(markdown).toContain(`**In short:** ${lesson.frontmatter.inShort}`);
      expect(markdown).toContain("## Key takeaways");
      for (const source of lesson.frontmatter.sources) expect(markdown).toContain(source.url);
    }
  });
});
