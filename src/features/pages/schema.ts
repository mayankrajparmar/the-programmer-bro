import { z } from "zod";

/** The pages in the footer's "The site" column, by their URL. */
export const PAGE_SLUGS = ["about", "privacy", "terms", "ai-content", "contact"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export const PageFrontmatterSchema = z
  .object({
    /** The page's heading and title. */
    title: z.string().min(1).max(60),
    /** One sentence under the heading, also used for search results (50 to 160 characters). */
    description: z.string().min(50).max(160),
    /** When the page last changed in a way readers should know about (YYYY-MM-DD). */
    lastUpdated: z.iso.date(),
  })
  .strict();

export type PageFrontmatter = z.infer<typeof PageFrontmatterSchema>;
