import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Browser tests run without a database, so sign-in shows its "not set up" state.
// Signing in and approving stories need Supabase; check those on a preview deployment.

test.describe("admin", () => {
  test("sends signed-out visitors to the sign-in page", async ({ page }) => {
    await page.goto("/admin/news");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("explains a sign-in link that didn't work", async ({ page }) => {
    await page.goto("/admin/auth/confirm?code=expired");
    await expect(page).toHaveURL(/\/admin\/login\?error=link$/);
    await expect(page.getByText(/That sign-in link didn't work/)).toBeVisible();
  });

  test("keeps admin pages out of search engines", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
  });

  for (const theme of ["dark", "light"] as const) {
    test(`sign-in has no detectable accessibility problems in the ${theme} theme`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem("tpb-theme", value), theme);
      await page.goto("/admin/login?error=link");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});
