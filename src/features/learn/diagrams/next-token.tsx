/*
 * Lesson 4, figure 1: made-up probabilities for the word after "Dal, chawal aur",
 * as bars on a 0–100% track so each bar shows its share of the whole. A list
 * rather than an SVG: every value is printed as text. One series, one colour.
 */

interface Choice {
  word: string;
  /** Percent; the six add up to 100. */
  percent: number;
}

/** Shared with the lesson's temperature table, which starts from these numbers. */
export const NEXT_WORD_CHOICES: readonly Choice[] = [
  { word: "sabzi", percent: 35 },
  { word: "achaar", percent: 25 },
  { word: "papad", percent: 18 },
  { word: "raita", percent: 12 },
  { word: "roti", percent: 9 },
  { word: "ice cream", percent: 1 },
];

/** The figure as text, for the Markdown copy of the lesson (llms-full.txt). */
export const nextTokenMarkdown = [
  'Made-up probabilities for the next word after "Dal, chawal aur":',
  "",
  ...NEXT_WORD_CHOICES.map((choice) => `- ${choice.word}: ${choice.percent}%`),
].join("\n");

export function NextTokenDiagram() {
  return (
    <div className="grid gap-4">
      <p className="m-0 font-display text-label">
        Dal, chawal aur <span className="text-text-muted">___</span>
      </p>
      <ol
        aria-label="Made-up probabilities for the next word after “Dal, chawal aur”"
        className="m-0 grid list-none gap-3 p-0"
      >
        {NEXT_WORD_CHOICES.map((choice) => (
          <li key={choice.word} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-small">
              <span>{choice.word}</span>
              <span>{choice.percent}%</span>
            </div>
            <div aria-hidden className="h-3 rounded-sm bg-surface-raised">
              <div
                className="h-full min-w-[3px] rounded-sm bg-amber"
                style={{ width: `${choice.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
