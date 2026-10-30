import type { Metadata } from "next";
import { site } from "@/config/site";
import { isoDateTime } from "./structured-data";

/** The site-wide share card (src/app/opengraph-image.png). */
export const DEFAULT_SHARE_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: `${site.name}: ${site.tagline}`,
} as const;

export interface PageSeo {
  /** The page's own title; the layout's template adds the site name. */
  title: string;
  /** 50 to 160 characters: what someone gets from this page. */
  description: string;
  /** The canonical path, e.g. "/news". */
  path: string;
  type?: "website" | "article";
  /** YYYY-MM-DD, for articles; sent as a full date-time in India time. */
  publishedTime?: string;
  modifiedTime?: string;
  /** The share image. Leave it out for the site-wide card; null for none. */
  image?: { url: string; width: number; height: number; alt: string } | null;
}

/**
 * Title, description, canonical URL, Open Graph and X card for one page. Next.js merges
 * metadata shallowly, so a page that sets only `title` would inherit the home page's
 * og:title and og:url; every public page builds its metadata here instead.
 */
export function seoMetadata({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
  image = DEFAULT_SHARE_IMAGE,
}: PageSeo): Metadata {
  const images = image ? [image] : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: site.name,
      locale: site.locale,
      url: path,
      title,
      description,
      ...(images && { images }),
      ...(type === "article" && {
        publishedTime: publishedTime && isoDateTime(publishedTime),
        modifiedTime: modifiedTime && isoDateTime(modifiedTime),
        authors: [site.author.url],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images && { images }),
    },
  };
}
