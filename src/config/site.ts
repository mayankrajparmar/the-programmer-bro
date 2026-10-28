/** Site-wide facts used by metadata, the sitemap and the pages. */

export interface SocialLink {
  label: "LinkedIn" | "X" | "Instagram" | "YouTube";
  href: string;
}

export const site = {
  name: "The Programmer Bro",
  shortName: "Programmer Bro",
  /** Canonical origin. Set NEXT_PUBLIC_SITE_URL on staging so its links point at itself. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://theprogrammerbro.in",
  tagline: "Learn how AI really works",
  description:
    "Free lessons from the basics to expert level, with quizzes and daily AI news. Launching soon.",
  locale: "en_IN",
  /**
   * The coming-soon page shows a button for each profile listed here, in this order.
   * Add X and YouTube here when those profiles exist.
   */
  social: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/the-programmer-bro/" },
    { label: "Instagram", href: "https://www.instagram.com/theprogrammerbro/" },
  ] as SocialLink[],
} as const;

/**
 * Only production may be indexed. Vercel sets VERCEL_ENV to "preview" on branch
 * deployments; elsewhere (local builds, CI) the site counts as production.
 */
export const allowIndexing = (process.env.VERCEL_ENV ?? "production") === "production";
