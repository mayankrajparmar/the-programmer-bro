import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { compileMdx, readingMinutes, splitFrontmatter } from "./mdx";

describe("splitFrontmatter", () => {
  it("separates YAML from the body", () => {
    const { data, body } = splitFrontmatter("---\ntitle: Hi\ndraft: true\n---\n\n# Body\n");
    expect(data).toEqual({ title: "Hi", draft: true });
    expect(body.trim()).toBe("# Body");
  });

  it("treats a file without frontmatter as all body", () => {
    expect(splitFrontmatter("Just text").data).toEqual({});
  });
});

describe("compileMdx", () => {
  it("gives ## headings stable, unique ids and lists them", () => {
    const { Content, headings } = compileMdx(
      "## What is AI?\n\nText\n\n## What is AI?\n\n### Deeper\n",
    );
    expect(headings).toEqual([
      { id: "what-is-ai", text: "What is AI?" },
      { id: "what-is-ai-1", text: "What is AI?" },
    ]);
    const html = renderToStaticMarkup(<Content />);
    expect(html).toContain('<h2 id="what-is-ai">');
    expect(html).toContain("<h3>Deeper</h3>");
  });

  it("supports tables and custom components", () => {
    const { Content } = compileMdx('| a | b |\n| - | - |\n| 1 | 2 |\n\n<Hello name="bro" />\n');
    const html = renderToStaticMarkup(
      <Content components={{ Hello: ({ name }: { name: string }) => <p>Hi {name}</p> }} />,
    );
    expect(html).toContain("<table>");
    expect(html).toContain("<p>Hi bro</p>");
  });
});

describe("readingMinutes", () => {
  it("counts prose at 200 words a minute and ignores code", () => {
    const prose = Array.from({ length: 600 }, () => "word").join(" ");
    const code = "```python\n" + "x = 1\n".repeat(500) + "```";
    expect(readingMinutes(`${prose}\n\n${code}`)).toBe(3);
  });

  it("is at least one minute", () => {
    expect(readingMinutes("Short.")).toBe(1);
  });
});
