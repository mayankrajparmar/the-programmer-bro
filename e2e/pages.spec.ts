import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  ["/about", "About"],
  ["/privacy", "Privacy policy"],
  ["/terms", "Terms of use"],
  ["/ai-content", "AI-content disclaimer"],
  ["/contact", "Contact"],
] as const;

test.describe("site pages", () => {
  for (const [path, title] of PAGES) {
    test(`${path} has its heading, date and a canonical link`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(page.getByText(/^Last updated/)).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://theprogrammerbro.in${path}`,
      );
    });
  }

  test("contact offers email first, then social profiles", async ({ page }) => {
    await page.goto("/contact");
    await expect(
      page.getByRole("link", { name: "contact@theprogrammerbro.in" }).first(),
    ).toHaveAttribute("href", "mailto:contact@theprogrammerbro.in");
    await expect(page.getByRole("link", { name: /^Visit LinkedIn/ })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  for (const theme of ["dark", "light"] as const) {
    test(`have no detectable accessibility problems in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("tpb-theme", value), theme);
      for (const [path] of PAGES) {
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations.map((v) => `${path} ${v.id}: ${v.help}`)).toEqual([]);
      }
    });
  }
});
