import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES } from "@/config/routes";
import { site } from "@/config/site";
import { isLive } from "@/config/site-mode";
import { getLearnRoutes } from "@/features/learn";

export default function sitemap(): MetadataRoute.Sitemap {
  // Until launch, production only serves the coming-soon page.
  const routes = isLive
    ? [...PUBLIC_ROUTES, "/learn", ...getLearnRoutes(), "/news", "/resources"]
    : [...PUBLIC_ROUTES];
  return routes.map((path) => ({
    url: new URL(path, site.url).toString(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
