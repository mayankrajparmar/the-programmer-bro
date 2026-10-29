/*
 * Title similarity, computed the way Postgres's pg_trgm does it: split each title
 * into lowercase words, pad each word ("  word "), take every run of three
 * characters, and compare the two sets (shared ÷ all). Two outlets reporting the
 * same story usually score above 0.6.
 */

export const SAME_STORY = 0.6;

export function trigrams(text: string): Set<string> {
  const grams = new Set<string>();
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  for (const word of words) {
    const padded = `  ${word} `;
    for (let i = 0; i + 3 <= padded.length; i++) grams.add(padded.slice(i, i + 3));
  }
  return grams;
}

export function similarity(a: string, b: string): number {
  const left = trigrams(a);
  const right = trigrams(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared++;
  return shared / (left.size + right.size - shared);
}

/** Compares titles against a growing list of titles already kept. */
export class TitleIndex {
  private readonly titles: Set<string>[] = [];

  constructor(titles: Iterable<string> = []) {
    for (const title of titles) this.add(title);
  }

  add(title: string): void {
    this.titles.push(trigrams(title));
  }

  /** True when a known title scores at or above `threshold` against this one. */
  hasSimilar(title: string, threshold = SAME_STORY): boolean {
    const grams = trigrams(title);
    if (grams.size === 0) return false;
    return this.titles.some((other) => {
      if (other.size === 0) return false;
      let shared = 0;
      for (const gram of grams) if (other.has(gram)) shared++;
      return shared / (grams.size + other.size - shared) >= threshold;
    });
  }
}
