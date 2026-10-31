import { describe, expect, it } from "vitest";
import { NEXT_WORD_CHOICES } from "../diagrams/next-token";
import { getLesson } from "./content";

/*
 * Lessons that show worked numbers get a test that redoes the maths, so a figure
 * and the table built from it can't drift apart.
 */

/** Temperature scaling: each probability to the power 1/T, then rescaled to add up to 100. */
function withTemperature(percents: readonly number[], temperature: number): number[] {
  const weights = percents.map((percent) => (percent / 100) ** (1 / temperature));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => (weight / total) * 100);
}

/** Whole percents that still add up to 100 (largest remainder first). */
function roundTo100(values: readonly number[]): number[] {
  const floors = values.map(Math.floor);
  const order = values
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  let left = 100 - floors.reduce((sum, value) => sum + value, 0);
  for (const { index } of order) {
    if (left-- <= 0) break;
    floors[index] = (floors[index] ?? 0) + 1;
  }
  return floors;
}

const cell = (percent: number) => (percent === 0 ? "under 1%" : `${percent}%`);

describe("worked numbers in lesson 4", () => {
  const lesson = getLesson("how-ai-works", "next-word");
  const percents = NEXT_WORD_CHOICES.map((choice) => choice.percent);

  it("starts from probabilities that add up to 100%", () => {
    expect(percents.reduce((sum, percent) => sum + percent, 0)).toBe(100);
  });

  it("shows the right numbers in the temperature table", () => {
    if (!lesson) throw new Error("lesson 4 is missing");
    const rows = lesson.body
      .split("\n")
      .filter(
        (line) => line.startsWith("| ") && !line.includes("---") && !line.includes("Next word"),
      )
      .map((line) =>
        line
          .split("|")
          .slice(1, -1)
          .map((part) => part.trim()),
      );
    const columns = [0.5, 1, 1.5].map((t) => roundTo100(withTemperature(percents, t)));

    expect(rows.map((row) => row[0])).toEqual(NEXT_WORD_CHOICES.map((choice) => choice.word));
    rows.forEach((row, i) => {
      expect(row.slice(1), String(row[0])).toEqual(columns.map((column) => cell(column[i] ?? -1)));
    });
  });

  it("gets the odds of at least one ice cream in 10 tries right", () => {
    const iceCream = (t: number) => (withTemperature(percents, t).at(-1) ?? 0) / 100;
    const atLeastOnce = (t: number) => 1 - (1 - iceCream(t)) ** 10;
    expect(atLeastOnce(1)).toBeCloseTo(0.1, 1); // "about 1 in 10"
    expect(atLeastOnce(1.5)).toBeCloseTo(0.25, 1); // "about 1 in 4"
    expect(lesson?.body).toContain("about 1 in 10");
    expect(lesson?.body).toContain("about 1 in 4");
  });
});
