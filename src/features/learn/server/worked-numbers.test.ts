import * as cl100k from "gpt-tokenizer/encoding/cl100k_base";
import * as o200k from "gpt-tokenizer/encoding/o200k_base";
import * as r50k from "gpt-tokenizer/encoding/r50k_base";
import { describe, expect, it } from "vitest";
import CAN_AI_REASON_QUIZ from "../../../../content/quizzes/can-ai-reason.json";
import HOW_MODELS_LEARN_QUIZ from "../../../../content/quizzes/how-models-learn.json";
import MULTIMODAL_QUIZ from "../../../../content/quizzes/multimodal-and-agents.json";
import NEURAL_NETWORKS_QUIZ from "../../../../content/quizzes/neural-networks.json";
import { DIGIT_NETWORK, outputPercent } from "../diagrams/digit-network";
import { BASE, TRAINING_STAGES } from "../diagrams/base-model";
import { GPT2, targetShare } from "../diagrams/gpt2-attention";
import { LEARN, samosaLoss } from "../diagrams/how-models-learn";
import {
  AGENT_RUN,
  CHEAPEST,
  IMAGE,
  inSamosa,
  PATCH_COUNT,
  PATCHES_PER_SIDE,
  TRAINS,
  VOICE_LATENCY,
  voiceMarkdown,
} from "../diagrams/multimodal-agents";
import { AIME, BILL, BILL_ANSWER, BILL_STEPS } from "../diagrams/reasoning";
import { BLOCK_ORDER, BLOCK_PARTS } from "../diagrams/transformer-block";
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
 * network numbers come from scripts/lessons/digit-network.py, via digit-network.json, and
 * lesson 10's GPT-2 numbers from scripts/lessons/gpt2-attention.py, via gpt2-attention.json,
 * lesson 11's training runs from scripts/lessons/how-models-learn.py, and lesson 12's GPT-2
 * outputs from scripts/lessons/base-model.py. Lesson 13 quotes published results, so its
 * test checks the sums built from them and that the text quotes them consistently.
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

describe("worked numbers in lesson 10", () => {
  const body = getLesson("how-ai-works", "transformer")?.body ?? "";
  const { model } = GPT2;
  const grouped = (value: number) => value.toLocaleString("en-US");
  // GPT-2's weights, from its design: Q, K and V together, the attention output, the
  // feed-forward network's two layers, and two normalisation steps.
  const attention =
    model.width * 3 * model.width + 3 * model.width + model.width ** 2 + model.width;
  const feedForward = model.width * model.mlp + model.mlp + model.mlp * model.width + model.width;
  const perBlock = attention + feedForward + 2 * 2 * model.width;

  it("adds up GPT-2's parameters from its design", () => {
    const embeddings = model.vocab * model.width + model.context * model.width;
    expect(embeddings + model.layers * perBlock + 2 * model.width).toBe(model.parameters);
    expect(Math.round(model.parameters / 1e6)).toBe(124);
    expect(body).toContain("with about 124 million parameters");
    expect(feedForward / perBlock).toBeCloseTo(2 / 3, 1);
    expect(body).toContain("hold about two-thirds of the parameters in each GPT-2 block");
    expect(body).toContain(
      `${model.width} numbers go in, through a hidden layer of ${grouped(model.mlp)} neurons`,
    );
  });

  it("counts the attention heads", () => {
    expect(model.layers * model.heads).toBe(144);
    expect(body).toContain(
      `GPT-2 has ${model.heads} heads in each of its ${model.layers} blocks, 144 in total`,
    );
    expect(126 * 128).toBe(16_128); // Llama 3.1 405B: 126 layers, 128 heads each
    expect(body).toContain("128 heads in each of its 126 layers: 16,128 heads");
    expect(body).toContain(`${GPT2.firstTokenTop} of GPT-2's 144 heads`);
  });

  it("shows the head's real attention, on GPT-2's real tokens", () => {
    for (const sentence of Object.values(GPT2.sentences)) {
      const tokens = r50k.encode(sentence.text).map((id) => r50k.decode([id]));
      expect(sentence.tokens).toEqual(tokens.slice(0, sentence.tokens.length));
      const total = sentence.percent.reduce((sum, value) => sum + value, 0);
      expect(Math.abs(total - 100)).toBeLessThan(0.3); // each value rounded to 0.1
    }
    const it = targetShare("it").toFixed(1);
    const she = targetShare("she").toFixed(1);
    const head = `layer ${GPT2.head.layer}, head ${GPT2.head.head}`;
    expect(body).toContain(
      `real attention from GPT-2 (${head}). The same head sends ${it}% of the attention from “it” to “suitcase”, and ${she}% of the attention from “she” to “Riya”`,
    );
    expect(body).toContain(`In a real GPT-2 head, "it" looks mostly at "suitcase"`);
    // "Mostly", leaving aside the first token (the attention sink).
    const itSentence = GPT2.sentences.it;
    const rest = itSentence.percent.slice(1);
    expect(itSentence.tokens[1 + rest.indexOf(Math.max(...rest))]).toBe(" suitcase");
  });

  it("shows GPT-2's real next-token probabilities", () => {
    expect(body).toContain(`We gave GPT-2 "${GPT2.next.prompt}"`);
    const rows = body.match(/^\| [a-z]+ +\| \d+\.\d% +\|$/gm) ?? [];
    expect(rows).toEqual(
      GPT2.next.tokens.map((token) =>
        expect.stringMatching(
          new RegExp(`^\\| ${token.text.trim()} +\\| ${token.percent.toFixed(1)}% +\\|$`),
        ),
      ),
    );
  });

  it("draws the block in the order GPT-2's own graph runs it", () => {
    // Read from the model by the script: normalise, attention, add, normalise, feed-forward, add.
    expect(BLOCK_ORDER).toEqual(GPT2.blockOrder);
    expect(BLOCK_ORDER).toEqual([
      "normalise",
      "attention",
      "add",
      "normalise",
      "feed-forward",
      "add",
    ]);
    expect(BLOCK_PARTS.attention.detail).toBe(`${model.heads} heads side by side`);
    expect(BLOCK_PARTS["feed-forward"].detail).toBe(
      `${model.width} → ${grouped(model.mlp)} → ${model.width}`,
    );
    expect(body).toContain(`GPT-2 stacks ${model.layers} of these, one after another`);
  });

  it("counts attention's comparisons for longer prompts", () => {
    // Each token compares itself with itself and every earlier token.
    const comparisons = (tokens: number) => (tokens * (tokens + 1)) / 2;
    expect(comparisons(1000)).toBe(500_500);
    expect(comparisons(2000)).toBe(2_001_000);
    expect(Math.round(comparisons(2000) / comparisons(1000))).toBe(4);
    expect(body).toContain(
      "1,000 tokens make 500,500 comparisons in each head, and 2,000 tokens make 2,001,000, about four times as many",
    );
  });
});

describe("worked numbers in lesson 11", () => {
  const body = getLesson("how-ai-works", "how-models-learn")?.body ?? "";
  const tableRows = (firstCell: RegExp) =>
    body
      .split("\n")
      .filter((line) => line.startsWith("| ") && firstCell.test(line.split("|")[1]?.trim() ?? ""))
      .map((line) =>
        line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim()),
      );
  /** Rupees as the lesson writes them: two decimals, a proper minus sign before the ₹. */
  const rupees = (value: number) => `${value < 0 ? "−" : ""}₹${Math.abs(value).toFixed(2)}`;
  const crossEntropy = (percent: number) => -Math.log(percent / 100);

  it("turns a real sentence into next-token practice questions with GPT-2's tokenizer", () => {
    const sentence = "Mumbai gets heavy rain every monsoon.";
    const tokens = r50k.encode(sentence).map((id) => r50k.decode([id]));
    const rows = tableRows(/^M/);
    expect(rows).toHaveLength(tokens.length - 1);
    rows.forEach(([seen, next], i) => {
      expect(seen).toBe(tokens.slice(0, i + 1).join(""));
      expect(next).toBe((tokens[i + 1] ?? "").replace(/^ /, "·"));
    });
    expect(body).toContain(
      `A sentence of ${tokens.length} tokens gives ${tokens.length - 1} practice questions`,
    );
  });

  it("works out the cross-entropy loss for GPT-2's real chances", () => {
    const rows = tableRows(/^(heavy|big|cold)$/);
    expect(rows).toHaveLength(3);
    for (const [word, given, loss] of rows) {
      const token = GPT2.next.tokens.find((t) => t.text.trim() === word);
      expect(given).toBe(`${token?.percent.toFixed(1)}%`);
      expect(loss).toBe(crossEntropy(token?.percent ?? 0).toFixed(2));
    }
    expect(crossEntropy(100)).toBeCloseTo(0);
    const start = LEARN.network.testLoss[0] ?? 0;
    expect(start).toBeGreaterThan(Math.log(10));
    expect(body).toContain(`started with a loss of ${start.toFixed(2)} on its test images`);
    expect(body).toContain(`which scores ${Math.log(10).toFixed(2)}`);
  });

  it("matches lesson 9's run, and counts its rounds of nudging", () => {
    const { network } = LEARN;
    expect(network.testAccuracy).toEqual(DIGIT_NETWORK.accuracy);
    expect(network.trainImages).toBe(DIGIT_NETWORK.trainImages);
    const perPass = Math.ceil(network.trainImages / DIGIT_NETWORK.batch);
    expect(network.updates).toBe(perPass * network.passes);
    expect(body).toContain(
      `${perPass} nudges per pass through its ${network.trainImages.toLocaleString("en-US")} images, and ${network.updates} over ${network.passes} passes`,
    );
    expect(body).toContain(
      `real loss of our handwriting network on ${network.testImages} test images`,
    );
  });

  it("runs gradient descent on the samosa price, as the table shows", () => {
    const { receipts, start, steps, runs } = LEARN.samosa;
    expect(receipts).toEqual([
      [1, 15],
      [2, 30],
      [3, 45],
      [5, 75],
    ]);
    const slope = (price: number) =>
      receipts.reduce((sum, [n = 0, bill = 0]) => sum + 2 * (price * n - bill) * n, 0) /
      receipts.length;
    // One row per step, one column per learning rate: too small, about right, too big.
    const rows = tableRows(/^[0-5]$/).filter((row) => row.length === 4);
    expect(rows).toHaveLength(6);
    expect(body).toContain("| Step | 0.005 (too small) | 0.04 (about right) | 0.11 (too big) |");
    Object.values(runs).forEach((run, column) => {
      const prices = [start];
      for (let i = 0; i < steps; i++) {
        prices.push((prices.at(-1) ?? 0) - run.rate * slope(prices.at(-1) ?? 0));
      }
      prices.forEach((price, i) => expect(run.prices[i]).toBeCloseTo(price, 2));
      rows.forEach((row, step) => expect(row[column + 1]).toBe(rupees(prices[step] ?? 0)));
    });
    expect(samosaLoss(start)).toBe(runs["about right"].losses[0]);
    expect(samosaLoss(15)).toBe(0);
    expect(body).toContain(
      `after 8 steps it has only reached ${rupees(runs["too small"].prices[8] ?? 0)}`,
    );
    expect(rupees(runs["about right"].prices[6] ?? 0)).toBe("₹15.00");
    expect(body).toContain("it's at ₹15.00 by step 6");
    expect(body).toContain(
      `to ${rupees(runs["about right"].prices[1] ?? 0)}, then ${rupees(runs["about right"].prices[2] ?? 0)}, then ${rupees(runs["about right"].prices[3] ?? 0)}`,
    );
  });

  it("reports the network's learning rates and overfitting runs as recorded", () => {
    const rates = tableRows(/^\d+(\.\d+)?$/).filter((row) => row.length === 2);
    expect(rates).toEqual(
      LEARN.learningRates.map((r) => [String(r.rate), `${r.accuracy.toFixed(1)}%`]),
    );
    const few = tableRows(/^[\d,]+ \(\d+ passes\)$/);
    expect(few).toEqual(
      LEARN.fewImages.map((run) => [
        `${run.images.toLocaleString("en-US")} (${run.passes} passes)`,
        `${run.train.toFixed(1)}%`,
        `${run.test.toFixed(1)}%`,
      ]),
    );
    expect(body).toContain(`but only ${LEARN.fewImages[0]?.test}% of new ones`);
  });

  it("states Llama 3's training scale correctly", () => {
    expect(3.8e25).toBe(38 * 1e24);
    expect(body).toContain("3.8 × 10²⁵ calculations (that's 38 followed by 24 zeros)");
  });

  it("gets the quiz's sums right", () => {
    const answer = (id: string) => {
      const q = HOW_MODELS_LEARN_QUIZ.questions.find((question) => question.id === id);
      return q?.options[q.answer];
    };
    expect(answer("practice-questions")).toBe(String(12 - 1));
    const explanation = HOW_MODELS_LEARN_QUIZ.questions.find(
      (q) => q.id === "cross-entropy",
    )?.explanation;
    expect(explanation).toContain(`about ${crossEntropy(90).toFixed(2)}`);
    expect(explanation).toContain(`about ${crossEntropy(10).toFixed(2)}`);
  });
});

describe("worked numbers in lesson 12", () => {
  const body = getLesson("how-ai-works", "base-model-to-assistant")?.body ?? "";
  const { question, instruction, pattern } = BASE.prompts;

  it("shows what GPT-2 really wrote, and describes it fairly", () => {
    expect(BASE.tokens).toBe(20);
    expect(body).toContain(
      `let it write ${BASE.tokens} tokens, always picking its most likely next token`,
    );
    expect(question.prompt).toBe("What is the capital of India?");
    // "It doesn't answer either; it just carries on writing."
    for (const run of [question, instruction]) {
      expect(run.continuation).not.toMatch(/Delhi/);
      expect(run.top[0]?.text).toBe("\n");
    }
    // The pattern: it answers, its top guess is Mumbai (wrong), then writes the next question.
    expect(pattern.prompt.endsWith("Q: What is the capital of India?\nA:")).toBe(true);
    expect(pattern.top[0]?.text).toBe(" Mumbai");
    const delhi = pattern.top.find((token) => token.text === " Delhi");
    expect(delhi?.percent).toBeLessThan(pattern.top[0]?.percent ?? 0);
    expect(pattern.continuation.trimStart().startsWith("Mumbai\nQ:")).toBe(true);
    expect(body).toContain("its top guess, Mumbai, is wrong");
  });

  it("uses GPT-2's real tokens for the prompts", () => {
    for (const run of Object.values(BASE.prompts)) {
      expect(r50k.encode(run.prompt).length).toBeGreaterThan(0);
      expect(r50k.decode(r50k.encode(run.prompt))).toBe(run.prompt);
      expect(r50k.encode(run.continuation).length).toBeLessThanOrEqual(BASE.tokens + 2);
    }
  });

  it("gets InstructGPT's numbers right, in the text and the figure", () => {
    expect(175 / 1.3).toBeGreaterThan(100);
    expect(body).toContain("over 100 times bigger");
    expect(body).toContain("about 13,000 prompts with answers written by a team of about 40");
    expect(body).toContain("rankings for about 33,000 prompts");
    const details = TRAINING_STAGES.map((stage) => stage.detail).join(" ");
    expect(details).toContain("about 13,000 prompts");
    expect(details).toContain("about 33,000 prompts");
    expect(details).toContain("300 billion tokens (lesson 3)");
  });

  it("writes the chat in Llama 3.1's real format", () => {
    const chat = /```text\n(<\|begin_of_text\|>[\s\S]*?)```/.exec(body)?.[1] ?? "";
    expect(chat).toBe(
      [
        "<|begin_of_text|><|start_header_id|>system<|end_header_id|>",
        "",
        "You are a helpful assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>",
        "",
        "What is the capital of India?<|eot_id|><|start_header_id|>assistant<|end_header_id|>",
        "",
        "",
      ].join("\n"),
    );
  });
});

describe("worked numbers in lesson 13", () => {
  const body = getLesson("how-ai-works", "can-ai-reason")?.body ?? "";
  const percents = (text: string) => text.match(/\d+(\.\d+)?%/g) ?? [];

  it("adds up Riya's bill correctly in Figure 1", () => {
    const total = BILL.items.reduce((sum, item) => sum + item.count * item.price, 0);
    expect(total).toBe(3 * 15 + 2 * 12);
    expect(BILL.paid - total).toBe(31);
    expect(BILL_STEPS).toEqual([
      "3 samosas × ₹15 = ₹45",
      "2 cups of chai × ₹12 = ₹24",
      "Total: ₹45 + ₹24 = ₹69",
      "Change: ₹100 − ₹69 = ₹31",
      "Check: ₹69 + ₹31 = ₹100, so that's right.",
    ]);
    expect(BILL_ANSWER).toBe("Riya gets ₹31 back.");
    expect(body).toContain("the samosa and chai bill from Figure 1");
  });

  it("matches OpenAI's AIME results: each percent is the problems solved out of 15", () => {
    // "Learning to reason with LLMs" (OpenAI, 2024) gives both forms for each result.
    expect(AIME.map((row) => [row.percent, row.solved])).toEqual([
      [12, 1.8],
      [74, 11.1],
      [83, 12.5],
      [93, 13.9],
    ]);
    for (const row of AIME) expect(Math.round((row.solved / 15) * 100)).toBe(row.percent);
    expect(body).toContain("GPT-4o, which answers straight away, solved 12% of the problems");
    expect(body).toContain("o1 solved 74% with one try each");
    expect(body).toContain(
      "let it answer 64 times and took the most common answer, it reached 83%",
    );
    expect(AIME[2]?.how).toBe("most common answer of 64 tries");
    expect(body).toContain("the share of the 15 AIME 2024 problems solved");
  });

  it("works out the kiwi question, and the mistake o1-mini made", () => {
    const question = /```text\n(Oliver[\s\S]*?)```/.exec(body)?.[1] ?? "";
    expect(question).toContain("44 kiwis on Friday");
    expect(question).toContain("58 kiwis on Saturday");
    expect(question).toContain("double the number of kiwis he did on Friday");
    expect(question).toContain("five of them were a bit smaller");
    const [friday, saturday] = [44, 58];
    const sunday = 2 * friday;
    expect(friday + saturday + sunday).toBe(190);
    expect(body).toContain(`${friday} + ${saturday} + ${sunday} = 190`);
    // o1-mini took the five small kiwis away: 88 - 5 = 83, then 44 + 58 + 83.
    expect(friday + saturday + (sunday - 5)).toBe(185);
    expect(body).toContain("o1-mini answered 185");
  });

  it("reports GSM-NoOp's drops from the paper's own numbers", () => {
    // GSM-Symbolic (Mirzadeh et al., 2024), appendix Table 1: GSM8K and Symbolic-NoOp accuracy.
    const paper = { "GPT-4o": [95.2, 63.1], "o1-mini": [95.1, 66.0], "o1-preview": [94.9, 77.4] };
    const rows = body
      .split("\n")
      .filter((line) => /^\| (GPT-4o|o1-mini|o1-preview) /.test(line))
      .map((line) =>
        line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim()),
      );
    expect(rows).toEqual(
      Object.entries(paper).map(([model, [before, after]]) => [
        model,
        `${before?.toFixed(1)}%`,
        `${after?.toFixed(1)}%`,
      ]),
    );
    const drops = Object.values(paper).map(([before = 0, after = 0]) => before - after);
    // "o1-preview held up best": the smallest drop and the highest score with the extra sentence.
    expect(Math.min(...drops)).toBe(drops[2]);
    expect(drops[2]?.toFixed(1)).toBe("17.5");
    expect(body).toContain("dropped by 17.5 points");
    // "Some smaller models dropped by more than 60 points": Phi-3-mini and Gemma2-9b.
    expect(83.7 - 18.0).toBeGreaterThan(60);
    expect(85.3 - 22.3).toBeGreaterThan(60);
    expect(body).toContain("some smaller models dropped by more than 60 points");
  });

  it("quotes the other published numbers as the sources give them", () => {
    expect(body).toContain("went from 17.9% correct to 56.9%"); // Wei et al. 2022, PaLM 540B
    expect(body).toContain("scored 35 out of 42"); // Google DeepMind, IMO 2025
    expect(body).toContain("Claude 3.7 Sonnet mentioned it only 25% of the time");
    expect(body).toContain("DeepSeek R1 39% of the time"); // Anthropic, 2025
  });

  it("uses only numbers from the lesson in the quiz", () => {
    for (const question of CAN_AI_REASON_QUIZ.questions) {
      for (const percent of percents(question.explanation)) expect(body).toContain(percent);
    }
    // The fruit question: less ripe mangoes still count.
    const fruit = CAN_AI_REASON_QUIZ.questions.find((q) => q.id === "irrelevant-detail");
    expect(fruit?.prompt).toContain("12 mangoes and 8 bananas");
    expect(fruit?.prompt).toContain("A model answers 17");
    expect(12 + 8).toBe(20);
    expect(12 + 8 - 3).toBe(17);
    expect(fruit?.options[fruit.answer]).toContain("the answer is 20");
  });
});

describe("worked numbers in lesson 14", () => {
  const body = getLesson("how-ai-works", "multimodal-and-agents")?.body ?? "";

  it("cuts the picture into the Vision Transformer's 196 patches", () => {
    expect(IMAGE).toEqual({ size: 224, patch: 16 });
    expect(PATCHES_PER_SIDE).toBe(224 / 16);
    expect(PATCH_COUNT).toBe(14 * 14);
    expect(body).toContain("14 rows of 14 patches, so 196 in all");
    // The pixel-art samosa is a symmetric triangle inside the grid.
    const cells = Array.from({ length: PATCH_COUNT }, (_, i) => [
      Math.floor(i / PATCHES_PER_SIDE),
      i % PATCHES_PER_SIDE,
    ]);
    const filled = cells.filter(([row = 0, column = 0]) => inSamosa(row, column));
    expect(filled.length).toBeGreaterThan(20);
    expect(filled.length).toBeLessThan(PATCH_COUNT / 2);
    for (const [row = 0, column = 0] of cells) {
      expect(inSamosa(row, column)).toBe(inSamosa(row, PATCHES_PER_SIDE - 1 - column));
    }
  });

  it("matches Google's token counts for pictures and audio", () => {
    // "Understand and count tokens", Gemini API docs: 258 per small image or 768 × 768 tile,
    // 32 tokens per second of audio, and about 4 characters per token.
    const table = Object.fromEntries(
      body
        .split("\n")
        .filter((line) => /^\| (A small|Each 768|One second|A one-minute|About 4)/.test(line))
        .map((line) =>
          line
            .split("|")
            .slice(1, 3)
            .map((cell) => cell.trim()),
        ),
    );
    const minute = 60 * 32;
    expect(table).toEqual({
      "A small picture, up to 384 × 384 pixels": "258",
      "Each 768 × 768 tile of a bigger picture": "258",
      "One second of audio": "32",
      "A one-minute voice note": minute.toLocaleString("en-IN"),
      "About 4 characters of text": "1",
    });
    expect(Math.round((minute * 4) / 100) * 100).toBe(7700);
    expect(body).toContain("about as many tokens as 7,700 characters of text");
    expect(body).toContain("a one-minute voice note is 1,920 tokens");
  });

  it("quotes OpenAI's voice numbers, and 320 ms is about a third of a second", () => {
    expect(VOICE_LATENCY).toEqual({
      pipelineSeconds: { "GPT-3.5": 2.8, "GPT-4": 5.4 },
      gpt4oMilliseconds: { fastest: 232, average: 320 },
    });
    expect(voiceMarkdown).toContain("2.8 seconds (GPT-3.5) or 5.4 seconds (GPT-4)");
    expect(voiceMarkdown).toContain("as little as 232 milliseconds, 320 on average");
    expect(Math.abs(VOICE_LATENCY.gpt4oMilliseconds.average / 1000 - 1 / 3)).toBeLessThan(0.02);
    expect(body).toContain("reply in about a third of a second");
  });

  it("books the cheapest train, and only after you approve", () => {
    const cheapest = Math.min(...TRAINS.map((train) => train.fare));
    expect(CHEAPEST.fare).toBe(cheapest);
    expect(CHEAPEST.name).toBe("Garden City Express");
    const approve = AGENT_RUN.findIndex((step) => step.kind === "approve");
    const book = AGENT_RUN.findIndex((step) => step.text.startsWith("book_ticket("));
    expect(approve).toBeGreaterThan(0);
    expect(book).toBeGreaterThan(approve);
    expect(AGENT_RUN[book]?.text).toContain(CHEAPEST.name);
    expect(AGENT_RUN[approve - 1]?.text).toContain("₹980");
  });

  it("works out how errors compound over many steps", () => {
    expect(Math.round(0.95 ** 20 * 100)).toBe(36);
    expect(body).toContain("the chance it gets 20 steps in a row right");
    expect(body).toContain("about 36%");
  });

  it("quotes METR's measurements as published", () => {
    expect(body).toContain('"doubling approximately every 7 months for the last 6 years"');
    expect(body).toContain('"a time horizon of approximately one hour"');
    // Paraphrased: MDX would read the quote's "<10%" as the start of a tag.
    expect(body).toContain(
      "less than 10% of the time on tasks that take people more than about 4 hours",
    );
  });

  it("gets the quiz's sums right", () => {
    const question = (id: string) => MULTIMODAL_QUIZ.questions.find((q) => q.id === id);
    const answer = (id: string) => {
      const q = question(id);
      return q?.options[q.answer];
    };
    expect(question("patch-count")?.prompt).toContain("320 × 320-pixel picture into 16 × 16");
    expect(answer("patch-count")).toBe(String((320 / 16) ** 2));
    expect(answer("audio-tokens")).toBe(String(30 * 32));
    expect(answer("compounding")).toBe(`About ${Math.round(0.9 ** 10 * 100)}%`);
  });
});
