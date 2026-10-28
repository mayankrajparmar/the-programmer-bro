import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The design-system page is the one full-site page so far: it shows the header,
// footer and every shared component. Local and CI builds run the site as "live".
const PAGE = "/design-system";

test.describe("site layout", () => {
  test("has the header, main content and footer landmarks", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("link", { name: "The Programmer Bro home" }).first()).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Design system");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "Privacy" })).toBeVisible();
    await expect(footer.getByRole("link", { name: /^LinkedIn/ })).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Mayank Raj Parmar" }),
    ).toHaveAttribute("href", "https://me.theprogrammerbro.in");
  });

  test("lets keyboard users skip to the main content", async ({ page }) => {
    await page.goto(PAGE);
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });

  test("switches theme and remembers the choice", async ({ page }) => {
    await page.goto(PAGE);
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
  });

  for (const theme of ["dark", "light"] as const) {
    test(`has no detectable accessibility problems in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("tpb-theme", value), theme);
      await page.goto(PAGE);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }

  test("copies a code sample", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only here");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(PAGE);
    const copy = page.getByRole("button", { name: "Copy" }).first();
    await copy.click();
    await expect(page.getByRole("button", { name: "Copied" }).first()).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("tokenizer.encode");
  });
});

test.describe("navigation", () => {
  test("shows the sections in the header on wide screens", async ({ page, isMobile }) => {
    test.skip(isMobile, "phones use the menu");
    await page.goto(PAGE);
    const nav = page.getByRole("banner").getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link")).toHaveText(["Learn", "AI News", "Resources"]);
    await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
  });

  test("folds the sections into a menu on phones", async ({ page, isMobile }) => {
    test.skip(!isMobile, "wide screens show the sections inline");
    await page.goto(PAGE);
    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toHaveAttribute("aria-expanded", "false");

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    const sheet = page.getByRole("navigation", { name: "Main" });
    await expect(sheet.getByRole("link")).toHaveText(["Learn", "AI News", "Resources"]);

    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(sheet).toBeHidden();
  });
});

test.describe("404 page", () => {
  test("answers unknown addresses with a 404 and a way home", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await page.getByRole("link", { name: "Go to the home page" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
