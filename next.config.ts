import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Lessons are read from content/ with fs, which Next.js can't trace on its own.
  // Include the files so an on-demand render (e.g. an unknown lesson's 404, or the home
  // page refreshing after a news story is approved) can read them too.
  outputFileTracingIncludes: {
    "/": ["./content/**/*"],
    "/learn/**": ["./content/**/*"],
    "/resources": ["./content/**/*"],
    "/sitemap.xml": ["./content/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
