import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Lessons are read from content/ with fs, which Next.js can't trace on its own.
  // Include the files so an on-demand render (e.g. an unknown lesson's 404) can read them too.
  outputFileTracingIncludes: {
    "/learn/**": ["./content/**/*"],
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
