import "server-only";
import { evaluateSync } from "@mdx-js/mdx";
import GithubSlugger from "github-slugger";
import type { Root } from "mdast";
import { toString } from "mdast-util-to-string";
import type { MDXContent } from "mdx/types";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { parse as parseYaml } from "yaml";

/*
 * MDX for content files (lessons now; About and legal pages later). Compiles
 * synchronously at build time, so pages prerender as static HTML, and maps
 * elements to design-system components through the `components` prop.
 */

export interface Heading {
  id: string;
  text: string;
}

export interface CompiledMdx {
  Content: MDXContent;
  /** The `##` headings in order, with the ids given to them: the table of contents. */
  headings: Heading[];
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Splits a content file into its YAML frontmatter (unvalidated) and its MDX body. */
export function splitFrontmatter(source: string): { data: unknown; body: string } {
  const match = FRONTMATTER.exec(source);
  if (!match) return { data: {}, body: source };
  return { data: parseYaml(match[1] ?? "") ?? {}, body: source.slice(match[0].length) };
}

/** Gives every `##` heading a stable id and records it for the table of contents. */
function remarkHeadingIds(options: { headings: Heading[] }) {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    visit(tree, "heading", (node) => {
      if (node.depth !== 2) return;
      const text = toString(node);
      const id = slugger.slug(text);
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
      options.headings.push({ id, text });
    });
  };
}

export function compileMdx(body: string): CompiledMdx {
  const headings: Heading[] = [];
  const { default: Content } = evaluateSync(body, {
    ...runtime,
    remarkPlugins: [remarkGfm, [remarkHeadingIds, { headings }]],
  });
  return { Content, headings };
}

/** Rough reading time for an MDX body at 200 words a minute, ignoring markup and code. */
export function readingMinutes(body: string): number {
  const prose = body
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/<[^>]+>/g, " ") // JSX tags
    .replace(/[#*_`>|[\]()-]/g, " "); // markdown punctuation
  const words = prose.split(/\s+/).filter((word) => /\p{L}|\p{N}/u.test(word)).length;
  return Math.max(1, Math.round(words / 200));
}
