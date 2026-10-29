import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { site } from "../../src/config/site";

// Runs against a production build (npm run test:e2e:production), where the launch switch
// shows only the coming-soon page.

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
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Mayank Raj Parmar" }),
    ).toHaveAttribute("href", "https://me.theprogrammerbro.in");
    expect(errors).toEqual([]);
  });

  test("links to every social profile in the site config", async ({ page }) => {
    await page.goto("/");
    const follow = page.getByRole("navigation", { name: "Follow along as we build it" });
    await expect(follow.getByRole("link")).toHaveCount(site.social.length);
    for (const { label, href } of site.social) {
      await expect(
        follow.getByRole("link", { name: `${label} (opens in a new tab)` }),
      ).toHaveAttribute("href", href);
    }
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

test.describe("before launch", () => {
  for (const path of ["/learn", "/learn/how-ai-works", "/news", "/resources", "/design-system"]) {
    test(`hides ${path}`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(404);
    });
  }

  test("keeps the admin sign-in reachable", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
  });
});
