import { expect, test } from "@playwright/test";

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
