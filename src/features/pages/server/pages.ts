import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { splitFrontmatter } from "@/lib/mdx";
import { PAGE_SLUGS, PageFrontmatterSchema, type PageFrontmatter, type PageSlug } from "../schema";

export interface SitePage {
  slug: PageSlug;
  frontmatter: PageFrontmatter;
  body: string;
}

const DIR = path.join(process.cwd(), "content", "pages");
const cache = new Map<PageSlug, SitePage>();

/** A page from content/pages/<slug>.mdx. Throws (failing the build) if it's missing or invalid. */
export function getPage(slug: PageSlug): SitePage {
  const hit = process.env.NODE_ENV === "development" ? undefined : cache.get(slug);
  if (hit) return hit;

  const file = path.join(DIR, `${slug}.mdx`);
  const { data, body } = splitFrontmatter(readFileSync(file, "utf8"));
  const parsed = PageFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(file)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`content/pages/${slug}.mdx: ${issues}`);
  }
  const page = { slug, frontmatter: parsed.data, body };
  cache.set(slug, page);
  return page;
}

/** Every site page with the day it last changed, for the sitemap. */
export function getPageSitemapEntries(): { path: string; lastModified: string }[] {
  return PAGE_SLUGS.map((slug) => ({
    path: `/${slug}`,
    lastModified: getPage(slug).frontmatter.lastUpdated,
  }));
}
