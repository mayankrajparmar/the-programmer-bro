import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The full site (as on previews), with sample news from e2e/fixtures/news.json.

const LESSON_1 = "/learn/how-ai-works/what-is-ai";

test.describe("home page", () => {
  test("welcomes a first visit with the promise and where to start", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    await expect(page).toHaveTitle("The Programmer Bro: Learn how AI really works");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Learn how AI really works");
    await expect(page.getByRole("link", { name: "Start lesson 1", exact: true })).toHaveAttribute(
      "href",
      LESSON_1,
    );
    await expect(page.getByRole("link", { name: "Read today's AI news" })).toHaveAttribute(
      "href",
      "/news",
    );
    await expect(
      page.getByRole("img", { name: /tokenizer and comes out as 8 tokens/ }).first(),
    ).toBeAttached();

    const start = page.getByRole("region", { name: "Start here" });
    await expect(start.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    await expect(
      start.getByRole("link", { name: "Start lesson 1: What is AI, really?" }),
    ).toHaveAttribute("href", LESSON_1);
    expect(errors).toEqual([]);
  });

  test("picks up where a returning learner left off", async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "tpb:progress:v1",
        JSON.stringify({
          version: 1,
          lessons: {
            "how-ai-works/what-is-ai": {
              bestScore: 5,
              total: 6,
              attempts: 1,
              completedAt: "2026-10-28T10:00:00.000Z",
            },
          },
        }),
      ),
    );
    await page.goto("/");
    const card = page.getByRole("region", { name: "Continue learning" });
    await expect(card.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    await expect(card.getByText("1 of 16 lessons done")).toBeVisible();
  });

  test("shows the three latest stories and the tracks coming next", async ({ page }) => {
    await page.goto("/");
    const news = page.getByRole("region", { name: "Latest AI news" });
    await expect(news.getByRole("article")).toHaveCount(3);
    await expect(news.getByRole("heading", { level: 3 }).first()).toHaveText(
      "An open-source model release adds a longer context window",
    );
    await expect(news.getByRole("link", { name: /^All AI news/ }).first()).toHaveAttribute(
      "href",
      "/news",
    );

    const next = page.getByRole("region", { name: "Coming next" });
    await expect(next.getByRole("listitem")).toHaveCount(6);
    await expect(next.getByRole("listitem").first()).toContainText("Prompt Engineering");
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
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});
