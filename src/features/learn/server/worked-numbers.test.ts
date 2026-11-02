import * as cl100k from "gpt-tokenizer/encoding/cl100k_base";
import * as o200k from "gpt-tokenizer/encoding/o200k_base";
import * as r50k from "gpt-tokenizer/encoding/r50k_base";
import { describe, expect, it } from "vitest";
import NEURAL_NETWORKS_QUIZ from "../../../../content/quizzes/neural-networks.json";
import { DIGIT_NETWORK, outputPercent } from "../diagrams/digit-network";
import GLOVE_SAMPLE from "../diagrams/glove-sample.json";
import { MEANING_MAP } from "../diagrams/meaning-map";
import { buysChai, CHAI_EXAMPLE, chaiTotal, signed } from "../diagrams/neuron";
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
 * against the real tokenizers (the gpt-tokenizer package, a dev dependency). Lesson 7's
 * numbers are checked against a sample of real GloVe vectors, written by
 * scripts/lessons/glove-embeddings.py, which also checks the parts that need all
 * 400,000 words (nearest neighbours, and which words GloVe doesn't have). Lesson 9's
 * network numbers come from scripts/lessons/digit-network.py, via digit-network.json.
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

describe("worked numbers in lesson 7", () => {
  const lesson = getLesson("how-ai-works", "embeddings");
  const body = lesson?.body ?? "";
  const glove: Record<string, number[]> = GLOVE_SAMPLE;

  const vector = (word: string) => {
    const found = glove[word];
    if (!found) throw new Error(`${word} is missing from glove-sample.json`);
    return found;
  };
  const dot = (a: readonly number[], b: readonly number[]) =>
    a.reduce((sum, value, i) => sum + value * (b[i] ?? 0), 0);
  const unit = (word: string) => {
    const v = vector(word);
    const length = Math.sqrt(dot(v, v));
    return v.map((value) => value / length);
  };
  const similarity = (a: string, b: string) => dot(unit(a), unit(b));
  /** Two decimals, with a proper minus sign, as the lesson writes them. */
  const shown = (value: number) => value.toFixed(2).replace("-", "−");

  it("starts dosa's embedding with the numbers the lesson shows", () => {
    const first = vector("dosa")
      .slice(0, 6)
      .map((value) => (Math.abs(value) < 0.005 ? "0.00" : shown(value)));
    expect(body).toContain(`"Dosa" starts ${first.join(", ")} and carries on for another 94`);
    expect(vector("dosa")).toHaveLength(100);
  });

  it("shows the real cosine similarities in the table", () => {
    const rows = body.match(/^\| [a-z]+ and [a-z]+ +\| −?\d\.\d\d +\|$/gm) ?? [];
    expect(rows).toHaveLength(6);
    for (const row of rows) {
      const [, a = "", b = "", score] = /^\| ([a-z]+) and ([a-z]+) +\| (\S+)/.exec(row) ?? [];
      expect(shown(similarity(a, b)), `${a} and ${b}`).toBe(score);
    }
  });

  it("gets the cheap, expensive and budget scores right", () => {
    expect(body).toContain(
      `"cheap" scores ${shown(similarity("cheap", "expensive"))} with "expensive" but only ${shown(similarity("cheap", "budget"))} with "budget"`,
    );
  });

  it("finds queen and Tokyo with word sums", () => {
    const closest = (from: string, minus: string, plus: string) => {
      const target = unit(from).map(
        (value, i) => value - (unit(minus)[i] ?? 0) + (unit(plus)[i] ?? 0),
      );
      const others = Object.keys(glove).filter((word) => ![from, minus, plus].includes(word));
      return others.sort((a, b) => dot(unit(b), target) - dot(unit(a), target))[0];
    };
    expect(closest("king", "man", "woman")).toBe("queen");
    expect(closest("delhi", "india", "japan")).toBe("tokyo");
  });

  it("puts kabaddi nearer kho-kho than cricket, and UPI near Newsweek", () => {
    expect(similarity("kabaddi", "kho-kho")).toBeGreaterThan(similarity("kabaddi", "cricket"));
    expect(similarity("kabaddi", "cricket")).toBeLessThan(similarity("cricket", "football"));
    const others = Object.keys(glove).filter((word) => !["upi", "newsweek"].includes(word));
    for (const word of others) {
      expect(similarity("upi", "newsweek"), word).toBeGreaterThan(similarity("upi", word));
    }
  });

  it("draws the map from the real two-dimensional squash (PCA)", () => {
    // Centre the twelve unit vectors, then find the two directions with the most spread
    // through the 12×12 Gram matrix, by power iteration with deflation.
    const rows = MEANING_MAP.map((point) => unit(point.word));
    const mean =
      rows[0]?.map((_, i) => rows.reduce((sum, row) => sum + (row[i] ?? 0), 0) / rows.length) ?? [];
    const centred = rows.map((row) => row.map((value, i) => value - (mean[i] ?? 0)));
    const gram = centred.map((a) => centred.map((b) => dot(a, b)));
    const total = gram.reduce((sum, row, i) => sum + (row[i] ?? 0), 0);

    const components: { values: number[]; size: number }[] = [];
    for (let k = 0; k < 2; k++) {
      let u = gram.map((_, i) => 1 + i / 10);
      let size = 0;
      for (let step = 0; step < 2000; step++) {
        const next = gram.map((row) => dot(row, u));
        size = Math.sqrt(dot(next, next));
        u = next.map((value) => value / size);
      }
      components.push({ values: u.map((value) => value * Math.sqrt(size)), size });
      for (let i = 0; i < gram.length; i++) {
        for (let j = 0; j < gram.length; j++) {
          (gram[i] as number[])[j] = (gram[i]?.[j] ?? 0) - size * (u[i] ?? 0) * (u[j] ?? 0);
        }
      }
    }

    const [x = [], y = []] = components.map((component) => component.values);
    const average = (values: number[], from: number) =>
      values.slice(from, from + 4).reduce((sum, value) => sum + value, 0) / 4;
    // Food on the left and sport at the top, as the script orients them.
    const xs = average(x, 0) > 0 ? x.map((value) => -value) : x;
    const ys = average(y, 4) < 0 ? y.map((value) => -value) : y;
    const scale = (values: number[]) => {
      const low = Math.min(...values);
      const high = Math.max(...values);
      return values.map((value) => ((value - low) / (high - low)) * 100);
    };
    const [sx, sy] = [scale(xs), scale(ys)];
    MEANING_MAP.forEach((point, i) => {
      expect(point.x, point.word).toBeCloseTo(sx[i] ?? -1, 0);
      expect(point.y, point.word).toBeCloseTo(sy[i] ?? -1, 0);
    });

    const kept = ((components[0]?.size ?? 0) + (components[1]?.size ?? 0)) / total;
    expect(Math.round(kept * 100)).toBe(60);
    expect(body).toContain("keeps only about 60% of the differences");
  });
});

describe("worked numbers in lesson 8", () => {
  const body = getLesson("how-ai-works", "rag")?.body ?? "";
  // Lesson 5's rules of thumb: a token is about three-quarters of a word, a page about 300 words.
  const words = (tokens: number) => tokens * 0.75;
  const pages = (tokens: number) => words(tokens) / 300;

  it("converts OpenAI's 800-token chunks to words and pages", () => {
    expect(words(800)).toBe(600);
    expect(pages(800)).toBe(2);
    expect(body).toContain("up to 800 tokens by default, which is about 600 words, or two pages");
    expect(body).toContain("overlaps the one before it by 400 tokens");
  });

  it("agrees with Anthropic that 200,000 tokens is about 500 pages", () => {
    expect(pages(200_000)).toBe(500);
    expect(body).toContain("under 200,000 tokens, about 500 pages");
  });

  it("rounds the paper's Wikipedia swap results fairly", () => {
    // Lewis et al. (2020), section 4.5: right-year index 70% and 68%, wrong-year 12% and 4%.
    const rightYear = [70, 68];
    const wrongYear = [12, 4];
    for (const score of rightYear) expect(Math.round(score / 10) * 10).toBe(70);
    expect(Math.max(...wrongYear)).toBe(12);
    expect(body).toContain("named about 70% of them correctly");
    expect(body).toContain("it managed 12% or fewer");
  });
});

describe("worked numbers in lesson 9", () => {
  const body = getLesson("how-ai-works", "neural-networks")?.body ?? "";
  const net = DIGIT_NETWORK;
  /** Weights and biases in a fully connected network with these layer sizes. */
  const parameters = (layers: readonly number[]) =>
    layers.slice(1).reduce((sum, size, i) => sum + (layers[i] ?? 0) * size + size, 0);
  const grouped = (value: number) => value.toLocaleString("en-US");

  it("adds up every row of the chai table", () => {
    const rows = body.match(/^\| [01], [01], [01] +\|.*\|$/gm) ?? [];
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      const cells = row
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      const values = (cells[0] ?? "").split(", ").map(Number);
      const total = chaiTotal(values);
      expect(cells[1], row).toMatch(new RegExp(`= ${signed(total)}$`));
      // The written sum: each input times its weight, then the bias.
      const terms = cells[1]
        ?.split(" = ")[0]
        ?.replaceAll("−", "-")
        .split(/ (?=[+-] )/);
      const written = terms?.reduce((sum, term) => sum + Number(term.replace(/\s/g, "")), 0);
      expect(written, row).toBe(total);
      expect(cells[2], row).toBe(buysChai(values) ? "Yes" : "No");
    }
    expect(body).toContain(`The total, ${chaiTotal(CHAI_EXAMPLE)}, is above 0`);
  });

  it("counts the parameters in our network, 3Blue1Brown's and Llama 3.1's comparison", () => {
    expect(net.parameters).toBe(parameters([net.inputs, net.hidden, net.outputs]));
    expect(net.parameters).toBe(64 * 16 + 16 + 16 * 10 + 10);
    expect(body).toContain(`That's ${grouped(net.parameters)} numbers`);
    expect(28 * 28).toBe(784);
    expect(parameters([784, 16, 16, 10])).toBe(13_002);
    expect(body).toContain("has 13,002 weights and biases");
    expect(Math.round(405e9 / net.parameters / 1e6)).toBe(335);
    expect(body).toContain("about 335 million times as many as ours");
  });

  it("reports the training run as the script recorded it", () => {
    expect(net.trainImages + net.testImages).toBe(net.images);
    expect(net.updates).toBe(net.passes * Math.ceil(net.trainImages / net.batch));
    const [before, ...rest] = net.accuracy;
    const after = rest.at(-1) ?? 0;
    expect(rest).toHaveLength(net.passes);
    expect(Math.round(((net.testImages - net.wrong) / net.testImages) * 1000) / 10).toBe(after);
    for (const text of [
      `${grouped(net.images)} handwritten digits`,
      `${net.testImages} images aside`,
      `read ${before}% of the test images correctly`,
      `After ${net.passes} passes`,
      `other ${grouped(net.trainImages)} images`,
      `${net.updates} rounds of nudging`,
      `read ${after}% correctly`,
      `only ${net.wrong} of the ${net.testImages} wrong`,
      `from ${before}% to ${after}% correct`,
    ]) {
      expect(body).toContain(text);
    }
  });

  it("shows the example image's real pixels and outputs", () => {
    const grid = net.example.pixels
      .map((row) => row.map((value) => String(value).padStart(2)).join(" "))
      .join("\n");
    expect(body).toContain(grid);
    const top = (percents: number[]) => percents.indexOf(Math.max(...percents));
    expect(top(net.example.before)).not.toBe(net.example.digit);
    expect(top(net.example.after)).toBe(net.example.digit);
    expect(body).toContain(`its top guess is ${top(net.example.before)}`);
    expect(body).toContain(
      `it's ${outputPercent(net.example.after[net.example.digit] ?? 0)} sure the image is a ${net.example.digit}`,
    );
    for (const percents of [net.example.before, net.example.after]) {
      const total = percents.reduce((sum, value) => sum + value, 0);
      expect(Math.abs(total - 100)).toBeLessThan(0.3); // each value rounded to 0.1
    }
  });

  it("gets the quiz's parameter count right", () => {
    const question = NEURAL_NETWORKS_QUIZ.questions.find((q) => q.id === "count-parameters");
    expect(question?.options[question.answer]).toBe(String(parameters([4, 3, 2])));
  });
});
