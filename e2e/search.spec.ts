import { expect, test, type Page } from "@playwright/test";

test.describe("search and sharing", () => {
  test("publishes metadata, robots.txt, a sitemap and a manifest", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /opengraph-image/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /theprogrammerbro\.in/,
    );

    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toContain("Sitemap: https://theprogrammerbro.in/sitemap.xml");

    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain("<loc>https://theprogrammerbro.in/</loc>");

    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({ name: "The Programmer Bro", start_url: "/" });

    for (const icon of [
      "/favicon.ico",
      "/icon-192.png",
      "/icon-512.png",
      "/brand/pb-logo-amber.svg",
    ]) {
      expect((await request.get(icon)).ok(), icon).toBe(true);
    }
  });
});

const ORIGIN = "https://theprogrammerbro.in";

async function structuredData(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((block) => JSON.parse(block)["@graph"] as Record<string, unknown>[]);
}

const hasType = (node: Record<string, unknown>, type: string) =>
  ([] as unknown[]).concat(node["@type"]).includes(type);

test.describe("search engines and AI answer engines", () => {
  for (const [path, title] of [
    ["/news", "AI News today, in plain English"],
    ["/resources", "Free AI resources: courses, videos, papers and tools"],
    ["/privacy", "Privacy policy"],
  ] as const) {
    test(`gives ${path} its own share title and address`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        ORIGIN + path,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", ORIGIN + path);
    });
  }

  test("describes the publisher on the home page", async ({ page }) => {
    await page.goto("/");
    const nodes = await structuredData(page);
    expect(nodes.find((node) => hasType(node, "Organization"))).toMatchObject({
      name: "The Programmer Bro",
      url: `${ORIGIN}/`,
    });
    expect(nodes.some((node) => hasType(node, "WebSite"))).toBe(true);
  });

  test("marks up a lesson as a reviewed article with its own share card", async ({
    page,
    request,
  }) => {
    const path = "/learn/how-ai-works/what-is-ai";
    await page.goto(path);
    const nodes = await structuredData(page);
    const article = nodes.find((node) => hasType(node, "Article"));
    expect(article).toMatchObject({ headline: "What is AI, really?", url: ORIGIN + path });
    expect(nodes.some((node) => hasType(node, "BreadcrumbList"))).toBe(true);
    await expect(page.getByText(/^Reviewed by Mayank Raj Parmar on/)).toBeVisible();

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    const card = `${path}/card.png`;
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      ORIGIN + card,
    );
    expect(article?.image).toBe(ORIGIN + card);
    const image = await request.get(card);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toBe("image/png");
  });

  test("marks up the track as a free course", async ({ page }) => {
    await page.goto("/learn/how-ai-works");
    const course = (await structuredData(page)).find((node) => hasType(node, "Course"));
    expect(course).toMatchObject({ name: "How AI Works", isAccessibleForFree: true });
  });

  test("publishes llms.txt and the full text of every lesson", async ({ request }) => {
    const map = await request.get("/llms.txt");
    expect(map.headers()["content-type"]).toContain("text/plain");
    const text = await map.text();
    expect(text).toMatch(/^# The Programmer Bro\n/);
    expect(text).toContain(`(${ORIGIN}/learn/how-ai-works/what-is-ai)`);

    const full = await (await request.get("/llms-full.txt")).text();
    expect(full).toContain("# What is AI, really?");
    expect(full).toContain("## Key takeaways");
    expect(full).not.toContain("<Analogy");
  });

  test("dates lessons in the sitemap", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toMatch(
      /<loc>https:\/\/theprogrammerbro\.in\/learn\/how-ai-works\/what-is-ai<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}/,
    );
  });
});
