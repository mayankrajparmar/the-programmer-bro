import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES } from "@/config/routes";
import { site } from "@/config/site";
import { isLive } from "@/config/site-mode";
import { getLearnSitemapEntries } from "@/features/learn";
import { getPageSitemapEntries } from "@/features/pages";

interface Entry {
  path: string;
  /** YYYY-MM-DD; left out where it changes too often to state honestly (home, news). */
  lastModified?: string | null;
}

export default function sitemap(): MetadataRoute.Sitemap {
  // In coming-soon mode, production only serves the coming-soon page.
  const entries: Entry[] = isLive
    ? [
        ...PUBLIC_ROUTES.map((path) => ({ path })),
        { path: "/learn" },
        ...getLearnSitemapEntries(),
        { path: "/news" },
        { path: "/resources" },
        ...getPageSitemapEntries(),
      ]
    : PUBLIC_ROUTES.map((path) => ({ path }));

  return entries.map(({ path, lastModified }) => ({
    url: new URL(path, site.url).toString(),
    ...(lastModified && { lastModified }),
    changeFrequency: path === "/" || path === "/news" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
