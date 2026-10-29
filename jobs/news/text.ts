const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

/** Decodes the HTML entities feeds commonly leave in text. Unknown names are kept as they are. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const point =
        code[1] === "x" || code[1] === "X"
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(point) && point > 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Turns an HTML fragment into one line of plain text. */
export function toPlainText(html: string | null | undefined): string {
  if (!html) return "";
  const text = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ");
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

/** Cuts text to at most `max` characters, at a word boundary, with an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * True when `text` repeats a run of `length` or more words from `source` word for word,
 * so a summary that copies a sentence from the feed can be caught and rewritten.
 */
export function copiesFrom(text: string, source: string, length = 10): boolean {
  const words = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(Boolean);
  const sourceWords = words(source);
  if (sourceWords.length < length) return false;
  const runs = new Set<string>();
  for (let i = 0; i + length <= sourceWords.length; i++) {
    runs.add(sourceWords.slice(i, i + length).join(" "));
  }
  const textWords = words(text);
  for (let i = 0; i + length <= textWords.length; i++) {
    if (runs.has(textWords.slice(i, i + length).join(" "))) return true;
  }
  return false;
}
