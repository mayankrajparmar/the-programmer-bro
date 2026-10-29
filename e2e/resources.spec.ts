import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("resources", () => {
  test("lists the hand-picked resources and filters them", async ({ page, isMobile }) => {
    await page.goto("/resources");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Resources");
    const cards = page.getByRole("main").getByRole("article");
    const total = await cards.count();
    expect(total).toBeGreaterThanOrEqual(10);

    await page.getByRole("button", { name: "Paper" }).click();
    await expect(page.getByRole("status")).toHaveText(new RegExp(`^Showing \\d+ of ${total}`));
    const types = await cards.evaluateAll((els) =>
      els.map((el) => el.querySelector("span")?.textContent ?? ""),
    );
    expect(types.length).toBeGreaterThan(0);
    expect(types.every((type) => type === "Paper")).toBe(true);

    await page.getByRole("button", { name: "Expert" }).click();
    await expect(page.getByRole("heading", { name: "No expert papers yet." })).toBeVisible();
    await page.getByRole("button", { name: /Show all resources/ }).click();
    await expect(cards).toHaveCount(total);

    if (!isMobile) {
      const nav = page.getByRole("banner").getByRole("navigation", { name: "Main" });
      await expect(nav.getByRole("link", { name: "Resources" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });

  test("opens resources in a new tab", async ({ page }) => {
    await page.goto("/resources");
    const open = page.getByRole("link", { name: /^Open Elements of AI/ });
    await expect(open).toHaveAttribute("target", "_blank");
    await expect(open).toHaveAttribute("href", "https://www.elementsofai.com/");
  });

  for (const theme of ["dark", "light"] as const) {
    test(`has no detectable accessibility problems in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("tpb-theme", value), theme);
      await page.goto("/resources");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});
