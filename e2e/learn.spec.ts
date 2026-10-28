import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TRACK = "/learn/how-ai-works";
const LESSON = `${TRACK}/what-is-ai`;
// Correct options for lesson 1's quiz, in order (content/quizzes/what-is-ai.json).
const CORRECT = [
  "It learns patterns from examples instead of following rules a person wrote",
  "A machine learning model trained on past payments",
  "AI, machine learning, deep learning, generative AI",
  "Generative AI",
  "The neural network has many layers",
  "No, it's one fixed rule that a person wrote",
];

test.describe("learning section", () => {
  test("lists the track on /learn", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Learn");
    await page.getByRole("link", { name: "Open the track" }).click();
    await expect(page).toHaveURL(TRACK);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("How AI Works");
  });

  test("shows the track plan with the first lesson up next", async ({ page, isMobile }) => {
    await page.goto(TRACK);
    await expect(page.getByText("0 of 16 lessons done")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /^Module [A-D]/ })).toHaveCount(4);
    await expect(page.getByRole("link", { name: /What is AI, really\?/ })).toBeVisible();
    // Lessons that aren't written yet are listed, but not linked.
    await expect(page.getByText("Meet the LLM")).toBeVisible();
    await expect(page.getByRole("link", { name: /Meet the LLM/ })).toHaveCount(0);
    if (!isMobile) {
      const nav = page.getByRole("banner").getByRole("navigation", { name: "Main" });
      await expect(nav.getByRole("link", { name: "Learn" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });

  test("renders a lesson with its summary, sections and sources", async ({ page, isMobile }) => {
    await page.goto(LESSON);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What is AI, really?");
    await expect(page.getByRole("region", { name: "In short" })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Machine learning: learning from examples" }),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: /Four nested boxes/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Key takeaways" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sources and further reading" })).toBeVisible();

    const toc = isMobile
      ? page.locator("details").filter({ hasText: "On this page" })
      : page.getByRole("navigation", { name: "On this page" });
    await expect(toc).toBeVisible();
  });

  for (const theme of ["dark", "light"] as const) {
    test(`has no detectable accessibility problems in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("tpb-theme", value), theme);
      for (const path of ["/learn", TRACK, LESSON]) {
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations.map((v) => `${path} ${v.id}: ${v.help}`)).toEqual([]);
      }
    });
  }

  test("takes the quiz and remembers the lesson as done", async ({ page }) => {
    await page.goto(LESSON);
    const quiz = page.locator("#quiz");

    for (const [index, option] of CORRECT.entries()) {
      await expect(quiz.getByText(`Question ${index + 1} of ${CORRECT.length}`)).toBeVisible();
      await quiz.getByLabel(option, { exact: true }).check();
      await quiz.getByRole("button", { name: "Check answer" }).click();
      await expect(quiz.getByRole("status").first()).toContainText("Correct!");
      const last = index === CORRECT.length - 1;
      await quiz.getByRole("button", { name: last ? "See your score" : "Next question" }).click();
    }

    await expect(quiz.getByRole("heading", { level: 3 })).toHaveText("You scored 6 of 6");

    await page.goto(TRACK);
    await expect(page.getByText("1 of 16 lessons done")).toBeVisible();
    await expect(page.getByText("Your progress is saved in this browser.")).toBeVisible();
  });

  test("answers lessons that don't exist with a 404", async ({ page }) => {
    const response = await page.goto(`${TRACK}/no-such-lesson`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });
});
