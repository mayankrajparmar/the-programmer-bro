import { describe, expect, it } from "vitest";
import { DEFAULT_SHARE_IMAGE, seoMetadata } from "./metadata";

describe("seoMetadata", () => {
  it("gives a page its own canonical URL, share title and address", () => {
    const meta = seoMetadata({ title: "AI News", description: "News.", path: "/news" });
    expect(meta.alternates?.canonical).toBe("/news");
    expect(meta.openGraph).toMatchObject({
      url: "/news",
      title: "AI News",
      description: "News.",
      type: "website",
      images: [DEFAULT_SHARE_IMAGE],
    });
    expect(meta.twitter).toMatchObject({ title: "AI News", card: "summary_large_image" });
  });

  it("adds article dates and leaves the image to the route's own card when asked", () => {
    const meta = seoMetadata({
      title: "Meet the LLM",
      description: "Lesson.",
      path: "/learn/how-ai-works/meet-the-llm",
      type: "article",
      publishedTime: "2026-10-30",
      modifiedTime: "2026-10-31",
      image: null,
    });
    expect(meta.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-10-30T00:00:00+05:30",
      modifiedTime: "2026-10-31T00:00:00+05:30",
    });
    expect(meta.openGraph).not.toHaveProperty("images");
    expect(meta.twitter).not.toHaveProperty("images");
  });
});
