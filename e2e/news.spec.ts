import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Browser tests build with NEWS_FIXTURES=1, so the page shows e2e/fixtures/news.json
// (20 sample stories over the last week) instead of the database.

test.describe("AI News", () => {
  test("shows today's stories first, grouped by day", async ({ page, isMobile }) => {
    await page.goto("/news");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("AI News");
    const days = page.getByRole("main").getByRole("heading", { level: 2 });
    await expect(days.first()).toHaveText("Today");
    await expect(days.nth(1)).toHaveText("Yesterday");

    const today = page.getByRole("region", { name: "Today" });
    await expect(today.getByRole("article")).toHaveCount(5);
    const first = today.getByRole("article").first();
    await expect(first.getByRole("heading", { level: 3 })).toHaveText(
      "An open-source model release adds a longer context window",
    );
    await expect(first.getByText("Source: Example Lab")).toBeVisible();

    if (!isMobile) {
      const nav = page.getByRole("banner").getByRole("navigation", { name: "Main" });
      await expect(nav.getByRole("link", { name: "AI News" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });

  test("links each story to its source in a new tab", async ({ page }) => {
    await page.goto("/news");
    const link = page.getByRole("link", {
      name: /^Read source: An open-source model release adds a longer context window/,
    });
    await expect(link).toHaveAttribute(
      "href",
      "https://lab.example.com/blog/open-model-long-context",
    );
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("filters by topic and loads older stories", async ({ page }) => {
    await page.goto("/news");
    const cards = page.getByRole("main").getByRole("article");
    await expect(cards).toHaveCount(15);
    await page.getByRole("button", { name: "Show older news" }).click();
    await expect(cards).toHaveCount(20);
    await expect(page.getByRole("button", { name: "Show older news" })).toHaveCount(0);

    await page.getByRole("button", { name: "Policy" }).click();
    await expect(page.getByRole("button", { name: "Policy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("heading", { name: "No Policy news today." })).toBeVisible();
    await expect(cards).toHaveCount(2);
    await expect(page.getByRole("status")).toHaveText("Showing 2 of 2 Policy stories");

    await page.getByRole("button", { name: /See all news/ }).click();
    await expect(page.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    await expect(cards).toHaveCount(15);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`has no detectable accessibility problems in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("tpb-theme", value), theme);
      await page.goto("/news");
      await page.getByRole("button", { name: "Policy" }).click();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});
