import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("coming-soon page", () => {
  test("shows the brand, headline and tokenizer demo without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/");

    await expect(page).toHaveTitle("The Programmer Bro: Learn how AI really works");
    await expect(page.getByRole("img", { name: "The Programmer Bro" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Learn how AI really works");
    await expect(
      page.getByRole("img", { name: /tokenizer and comes out as 8 tokens/ }),
    ).toBeVisible();
    await expect(page.locator("footer")).toContainText("The Programmer Bro");
    expect(errors).toEqual([]);
  });

  test("fits the screen without sideways scrolling", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`has no detectable accessibility problems in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("tpb-theme", value), theme);
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }

  test("defaults to the dark theme", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

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
