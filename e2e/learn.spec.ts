import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TRACK = "/learn/how-ai-works";
const LESSON = `${TRACK}/what-is-ai`;
const LESSON_2 = `${TRACK}/history`;
const LESSON_3 = `${TRACK}/meet-the-llm`;
const LESSON_4 = `${TRACK}/next-word`;
const LESSON_5 = `${TRACK}/tokens`;
const LESSON_6 = `${TRACK}/search-vs-llm`;
const LESSON_7 = `${TRACK}/embeddings`;
const LESSON_8 = `${TRACK}/rag`;
const LESSON_9 = `${TRACK}/neural-networks`;
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
    await expect(page.getByText("The Transformer, step by step")).toBeVisible();
    await expect(page.getByRole("link", { name: /The Transformer, step by step/ })).toHaveCount(0);
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

  test("renders lesson 2 with its timeline, linked from lesson 1", async ({ page }) => {
    await page.goto(LESSON_2);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "From rules to reasoning: a short history",
    );
    const timeline = page.getByRole("list", { name: "Timeline of AI from 1950 to today" });
    await expect(timeline.getByRole("listitem")).toHaveCount(13);
    await expect(timeline.getByRole("listitem").first()).toContainText("1950");
    await expect(page.locator("#quiz").getByText("Question 1 of 8")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Previous · Lesson 1/ })).toHaveAttribute(
      "href",
      LESSON,
    );
  });

  test("renders lesson 3 with its model sizes, linked from lesson 2", async ({ page }) => {
    await page.goto(LESSON_3);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meet the LLM");
    const sizes = page.getByRole("list", { name: "Parameters in three LLMs" });
    await expect(sizes.getByRole("listitem")).toHaveCount(3);
    await expect(sizes.getByRole("listitem").last()).toContainText("405 billion");
    await expect(page.locator("#quiz").getByText("Question 1 of 8")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Previous · Lesson 2/ })).toHaveAttribute(
      "href",
      LESSON_2,
    );
  });

  test("renders lesson 4 with its probabilities, linked from lesson 3", async ({ page }) => {
    await page.goto(LESSON_4);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Predicting the next word");
    const choices = page.getByRole("list", { name: /Made-up probabilities for the next word/ });
    await expect(choices.getByRole("listitem")).toHaveCount(6);
    await expect(choices.getByRole("listitem").first()).toContainText("35%");
    await expect(page.getByRole("cell", { name: "under 1%" })).toBeVisible();
    await expect(page.locator("#quiz").getByText("Question 1 of 8")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Previous · Lesson 3/ })).toHaveAttribute(
      "href",
      LESSON_3,
    );
  });

  test("renders lesson 5 with its token splits, linked from lesson 4", async ({ page }) => {
    await page.goto(LESSON_5);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tokens: the LLM's alphabet");
    const english = page.getByRole("list", { name: /as 7 tokens, each with its ID/ });
    await expect(english.getByRole("listitem")).toHaveCount(7);
    await expect(english.getByRole("listitem").nth(1)).toContainText("space then am, ID 939");
    const hindi = page.getByRole("list", { name: "The same sentence in Hindi as 23 tokens" });
    await expect(hindi.getByRole("listitem")).toHaveCount(23);
    await expect(page.locator("#quiz").getByText("Question 1 of 8")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Previous · Lesson 4/ })).toHaveAttribute(
      "href",
      LESSON_4,
    );
  });

  test("renders lesson 6 with its comparison, linked from lesson 5", async ({ page }) => {
    await page.goto(LESSON_6);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Search engine vs LLM");
    for (const name of ["How a search engine answers", "How an LLM answers"]) {
      await expect(page.getByRole("region", { name }).getByRole("listitem")).toHaveCount(3);
    }
    await expect(page.getByRole("cell", { name: "Search engine" }).first()).toBeVisible();
    await expect(page.locator("#quiz").getByText("Question 1 of 8")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Previous · Lesson 5/ })).toHaveAttribute(
      "href",
      LESSON_5,
    );
  });

  test("renders lesson 7 with its meaning map, linked from lesson 6", async ({ page }) => {
    await page.goto(LESSON_7);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Embeddings: meaning as numbers",
    );
    await expect(
      page.getByRole("img", { name: /A map of twelve words placed by meaning/ }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "dosa and idli" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "−0.09" })).toBeVisible();
    await expect(page.locator("#quiz").getByText("Question 1 of 8")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Previous · Lesson 6/ })).toHaveAttribute(
      "href",
      LESSON_6,
    );
  });

  test("renders lesson 8 with its RAG steps, linked from lesson 7", async ({ page }) => {
    await page.goto(LESSON_8);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "RAG: giving the model an open book",
    );
    for (const name of ["Preparing the documents", "Answering a question"]) {
      await expect(page.getByRole("region", { name }).getByRole("listitem")).toHaveCount(3);
    }
    await expect(
      page.getByRole("region", { name: "Answering a question" }).getByRole("listitem").first(),
    ).toContainText("Retrieve.");
    await expect(
      page.getByText("Question: Can I come back at 10:30 pm on a Saturday?"),
    ).toBeVisible();
    await expect(page.locator("#quiz").getByText("Question 1 of 8")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Previous · Lesson 7/ })).toHaveAttribute(
      "href",
      LESSON_7,
    );
  });

  test("renders lesson 9 with its neuron and digit network, linked from lesson 8", async ({
    page,
  }) => {
    await page.goto(LESSON_9);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Neural networks without the scary maths",
    );
    await expect(page.getByRole("img", { name: /A neuron with three inputs/ })).toBeVisible();
    await expect(
      page.getByRole("img", { name: /A neural network reading a handwritten 3/ }),
    ).toBeVisible();
    const after = page.getByRole("region", {
      name: "Outputs for the handwritten 3 after training",
    });
    await expect(after.getByRole("listitem")).toHaveCount(10);
    await expect(after.getByRole("listitem").nth(3)).toContainText("99.8%");
    await expect(page.getByRole("cell", { name: "2 + 3 − 4 − 1 = 0" })).toBeVisible();
    await expect(page.locator("#quiz").getByText("Question 1 of 8")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Previous · Lesson 8/ })).toHaveAttribute(
      "href",
      LESSON_8,
    );
  });

  for (const theme of ["dark", "light"] as const) {
    test(`has no detectable accessibility problems in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("tpb-theme", value), theme);
      for (const path of [
        "/learn",
        TRACK,
        LESSON,
        LESSON_2,
        LESSON_3,
        LESSON_4,
        LESSON_5,
        LESSON_6,
        LESSON_7,
        LESSON_8,
        LESSON_9,
      ]) {
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
