import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Runs against a production build (VERCEL_ENV=production npm run build, then
// npm run test:e2e:production): the site as visitors get it, with drafts and internal pages hidden.

test.describe("the live site", () => {
  test("opens on the home page, not the coming-soon page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Learn how AI really works");
    await expect(
      page.getByRole("banner").getByRole("link", { name: "The Programmer Bro home" }),
    ).toBeVisible();
    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute(
      "content",
      /Launching soon/,
    );
    await expect(page.getByRole("link", { name: "Start lesson 1", exact: true })).toHaveAttribute(
      "href",
      "/learn/how-ai-works/what-is-ai",
    );
  });

  for (const [slug, title] of [
    ["what-is-ai", "What is AI, really?"],
    ["history", "From rules to reasoning: a short history"],
    ["meet-the-llm", "Meet the LLM"],
  ] as const) {
    test(`publishes ${slug}, without a draft notice`, async ({ page }) => {
      const response = await page.goto(`/learn/how-ai-works/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(page.getByText("Draft: waiting for review")).toHaveCount(0);
    });
  }

  test("answers lessons that aren't written yet with a 404", async ({ request }) => {
    expect((await request.get("/learn/how-ai-works/search-vs-llm")).status()).toBe(404);
  });

  test("keeps internal pages out of production", async ({ request }) => {
    expect((await request.get("/design-system")).status()).toBe(404);
  });

  for (const [path, label, title] of [
    ["/about", "About", "About"],
    ["/privacy", "Privacy", "Privacy policy"],
    ["/terms", "Terms", "Terms of use"],
    ["/ai-content", "AI-content disclaimer", "AI-content disclaimer"],
    ["/contact", "Contact", "Contact"],
  ] as const) {
    test(`links to ${path} from the footer`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("contentinfo").getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    });
  }

  test("tells search engines about every public page", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /admin");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const path of [
      "/",
      "/learn/how-ai-works/what-is-ai",
      "/learn/how-ai-works/history",
      "/learn/how-ai-works/meet-the-llm",
      "/news",
      "/privacy",
      "/contact",
    ]) {
      expect(sitemap).toContain(`<loc>https://theprogrammerbro.in${path}</loc>`);
    }
  });

  test("has no detectable accessibility problems on the home page", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
