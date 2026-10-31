import * as cl100k from "gpt-tokenizer/encoding/cl100k_base";
import * as o200k from "gpt-tokenizer/encoding/o200k_base";
import * as r50k from "gpt-tokenizer/encoding/r50k_base";
import { describe, expect, it } from "vitest";
import { NEXT_WORD_CHOICES } from "../diagrams/next-token";
import {
  ENGLISH_SENTENCE,
  ENGLISH_TOKENS,
  HINDI_SENTENCE,
  HINDI_TOKENS,
  TOKEN_COUNTS,
} from "../diagrams/token-data";
import { getLesson } from "./content";

interface Encoder {
  encode: (text: string) => number[];
  decode: (ids: number[]) => string;
}

/*
 * Lessons that show worked numbers get a test that redoes the maths, so a figure
 * and the table built from it can't drift apart. Lesson 5's token splits are checked
 * against the real tokenizers (the gpt-tokenizer package, a dev dependency).
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

describe("worked numbers in lesson 5", () => {
  const lesson = getLesson("how-ai-works", "tokens");
  const pieces = (encoder: Encoder, text: string) =>
    encoder.encode(text).map((id) => encoder.decode([id]));

  it("shows GPT-4o's real split of the English sentence, with IDs", () => {
    const ids = o200k.encode(ENGLISH_SENTENCE);
    expect(ENGLISH_TOKENS.map((token) => token.id)).toEqual(ids);
    expect(ENGLISH_TOKENS.map((token) => token.text)).toEqual(pieces(o200k, ENGLISH_SENTENCE));
  });

  it("shows GPT-4o's real split of the Hindi sentence", () => {
    expect(HINDI_TOKENS).toEqual(pieces(o200k, HINDI_SENTENCE));
  });

  it("counts both sentences correctly with each tokenizer, in the data and the table", () => {
    const encoders: Record<string, Encoder> = {
      r50k_base: r50k,
      cl100k_base: cl100k,
      o200k_base: o200k,
    };
    for (const row of TOKEN_COUNTS) {
      const encoder = encoders[row.encoding];
      if (!encoder) throw new Error(row.encoding);
      expect(encoder.encode(ENGLISH_SENTENCE), row.tokenizer).toHaveLength(row.english);
      expect(encoder.encode(HINDI_SENTENCE), row.tokenizer).toHaveLength(row.hindi);
      expect(lesson?.body).toMatch(
        new RegExp(
          `\\| ${row.tokenizer.replace(/[()]/g, "\\$&")} +\\| ${row.english} +\\| ${row.hindi} +\\|`,
        ),
      );
    }
    expect(lesson?.body).toContain("cuts the sentence into 7 pieces");
    expect(lesson?.body).toContain("you get 23 pieces");
  });

  it("gets the example words right", () => {
    expect(pieces(o200k, " unbelievable")).toEqual([" unbelievable"]);
    expect(pieces(o200k, "Bengaluru")).toEqual(["B", "eng", "al", "uru"]);
    expect(pieces(o200k, "strawberry")).toEqual(["st", "raw", "berry"]);
    expect(o200k.encode("Hello")).toEqual([13225]);
    expect(o200k.encode(" hello")).toEqual([40617]);
    expect(pieces(o200k, "HELLO")).toEqual(["HEL", "LO"]);
  });

  it("puts GPT-4o's vocabulary at about 200,000 tokens", () => {
    expect(() => o200k.decode([199_999])).not.toThrow();
    expect(() => o200k.decode([201_000])).toThrow();
  });

  it("converts context windows to words and pages correctly", () => {
    const words = (tokens: number) => tokens * 0.75; // OpenAI's rule of thumb
    expect(words(1024) / 300).toBeCloseTo(2.5, 0); // "about two and a half pages"
    expect(words(128_000) / 300).toBeGreaterThan(300); // "roughly a 300-page book"
    expect(words(128_000) / 300).toBeLessThan(350);
  });
});
