import type { MetadataRoute } from "next";
import { allowIndexing, site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
