// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_KEY } from "../progress/progress-store";
import type { QuizQuestion } from "../schema";
import { LessonQuiz } from "./lesson-quiz";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const questions: QuizQuestion[] = [1, 2, 3, 4, 5].map((n) => ({
  id: `q${n}`,
  type: n > 3 ? "application" : "recall",
  prompt: `Question number ${n}?`,
  options: [`A${n}`, `B${n}`, `C${n}`, `D${n}`],
  answer: 1,
  explanation: `Because B${n} is the right one here.`,
}));

function renderQuiz(next = { number: 2, title: "Lesson two", href: "/l/2", published: true }) {
  return render(
    <LessonQuiz progressKey="t/one" questions={questions} next={next} trackHref="/t" />,
  );
}

function answer(option: string) {
  fireEvent.click(screen.getByLabelText(option));
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("LessonQuiz", () => {
  it("only lets you check once an option is picked", () => {
    renderQuiz();
    const check = screen.getByRole("button", { name: "Check answer" }) as HTMLButtonElement;
    expect(check.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("A1"));
    expect(check.disabled).toBe(false);
  });

  it("explains a wrong answer and marks the right one", () => {
    renderQuiz();
    answer("A1");
    expect(screen.getByRole("status").textContent).toContain("Not quite");
    expect(screen.getByRole("status").textContent).toContain("Because B1");
    expect(screen.getByText("Your answer")).toBeTruthy();
    expect(screen.getByText("Correct")).toBeTruthy();
  });

  it("scores the quiz, saves progress and offers the next lesson", () => {
    renderQuiz();
    for (let n = 1; n <= 5; n++) {
      answer(n === 2 ? `A${n}` : `B${n}`);
      fireEvent.click(
        screen.getByRole("button", { name: n < 5 ? /Next question/ : /See your score/ }),
      );
    }
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("You scored 4 of 5");
    expect(screen.getByText(/question 2/)).toBeTruthy();

    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
    expect(saved.lessons["t/one"]).toMatchObject({ bestScore: 4, total: 5, attempts: 1 });

    expect(screen.getByRole("link", { name: /Next lesson: Lesson two/ }).getAttribute("href")).toBe(
      "/l/2",
    );
  });

  it("starts again on retry", () => {
    renderQuiz();
    for (let n = 1; n <= 5; n++) {
      answer(`B${n}`);
      fireEvent.click(
        screen.getByRole("button", { name: n < 5 ? /Next question/ : /See your score/ }),
      );
    }
    fireEvent.click(screen.getByRole("button", { name: "Retry quiz" }));
    expect(screen.getByText("Question 1 of 5")).toBeTruthy();
    expect(screen.getByLabelText("A1")).toBeTruthy();
  });

  it("points back to the track when the next lesson isn't out yet", () => {
    renderQuiz({ number: 2, title: "Lesson two", href: "/l/2", published: false });
    for (let n = 1; n <= 5; n++) {
      answer(`B${n}`);
      fireEvent.click(
        screen.getByRole("button", { name: n < 5 ? /Next question/ : /See your score/ }),
      );
    }
    expect(screen.getByRole("link", { name: /Back to the track/ }).getAttribute("href")).toBe("/t");
    expect(screen.getByText(/is coming soon/)).toBeTruthy();
  });
});
