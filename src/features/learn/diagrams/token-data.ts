/*
 * Real tokenizer output for lesson 5, from OpenAI's GPT-4o tokenizer (o200k_base), plus
 * token counts from the GPT-2 (r50k_base) and GPT-4 (cl100k_base) tokenizers. A unit
 * test re-runs the tokenizers (the gpt-tokenizer package) and fails if any of this drifts.
 */

export interface Token {
  /** The token's text, including any space in front of it. */
  text: string;
  id: number;
}

export const ENGLISH_SENTENCE = "I am learning how AI works.";
export const HINDI_SENTENCE = "मैं सीख रहा हूँ कि AI कैसे काम करता है।";

/** ENGLISH_SENTENCE split by GPT-4o's tokenizer. */
export const ENGLISH_TOKENS: readonly Token[] = [
  { text: "I", id: 40 },
  { text: " am", id: 939 },
  { text: " learning", id: 7524 },
  { text: " how", id: 1495 },
  { text: " AI", id: 20837 },
  { text: " works", id: 5882 },
  { text: ".", id: 13 },
];

/** HINDI_SENTENCE split by GPT-4o's tokenizer. */
export const HINDI_TOKENS: readonly string[] = [
  "म",
  "ैं",
  " स",
  "ी",
  "ख",
  " रह",
  "ा",
  " ह",
  "ूँ",
  " क",
  "ि",
  " AI",
  " क",
  "ै",
  "स",
  "े",
  " क",
  "ाम",
  " करत",
  "ा",
  " ह",
  "ै",
  "।",
];

/** How many tokens each sentence takes, by tokenizer. */
export const TOKEN_COUNTS = [
  { tokenizer: "GPT-2 (2019)", encoding: "r50k_base", english: 7, hindi: 54 },
  { tokenizer: "GPT-4 (2023)", encoding: "cl100k_base", english: 7, hindi: 37 },
  { tokenizer: "GPT-4o (2024)", encoding: "o200k_base", english: 7, hindi: 23 },
] as const;
