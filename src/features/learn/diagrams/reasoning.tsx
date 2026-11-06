/*
 * Lesson 13's figures. Figure 1 is a made-up example of a reasoning model's "rough work":
 * a shopping bill, worked out step by step (the sums are checked by a unit test). Figure 2
 * is OpenAI's published AIME 2024 results for GPT-4o and o1, as bars on one 0-100% scale.
 * One colour; every value is text.
 */

export const BILL = {
  question:
    "Riya buys 3 samosas at ₹15 each and 2 cups of chai at ₹12 each. She pays with a ₹100 note. How much change does she get?",
  items: [
    { name: "samosas", count: 3, price: 15 },
    { name: "cups of chai", count: 2, price: 12 },
  ],
  paid: 100,
} as const;

const total = BILL.items.reduce((sum, item) => sum + item.count * item.price, 0);
const change = BILL.paid - total;

/** The rough work, line by line, worked out from the numbers above. */
export const BILL_STEPS: readonly string[] = [
  ...BILL.items.map(
    (item) => `${item.count} ${item.name} × ₹${item.price} = ₹${item.count * item.price}`,
  ),
  `Total: ${BILL.items.map((item) => `₹${item.count * item.price}`).join(" + ")} = ₹${total}`,
  `Change: ₹${BILL.paid} − ₹${total} = ₹${change}`,
  `Check: ₹${total} + ₹${change} = ₹${BILL.paid}, so that's right.`,
];
export const BILL_ANSWER = `Riya gets ₹${change} back.`;

export function ThinkingDiagram() {
  return (
    <div className="grid gap-3">
      <section aria-label="The question" className="grid gap-1">
        <p className="m-0 text-caption text-text-muted">The question</p>
        <p className="m-0 rounded-md border border-border bg-surface-raised p-4 text-small">
          {BILL.question}
        </p>
      </section>
      <section aria-label="The model's thinking" className="grid gap-1">
        <p className="m-0 text-caption text-text-muted">
          Thinking (in many apps, hidden or shown only as a summary)
        </p>
        <ol className="m-0 grid list-none gap-1 rounded-md border border-dashed border-border-strong bg-surface p-4 font-mono text-code-small">
          {BILL_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <section aria-label="The answer" className="grid gap-1">
        <p className="m-0 text-caption text-text-muted">The answer</p>
        <p className="m-0 rounded-md border border-amber bg-amber-subtle p-4 text-small font-semibold">
          {BILL_ANSWER}
        </p>
      </section>
    </div>
  );
}

/** OpenAI's AIME 2024 results (15 problems), from "Learning to reason with LLMs" (2024). */
export const AIME = [
  { model: "GPT-4o", how: "one try per problem", percent: 12, solved: 1.8 },
  { model: "o1", how: "one try per problem", percent: 74, solved: 11.1 },
  { model: "o1", how: "most common answer of 64 tries", percent: 83, solved: 12.5 },
  { model: "o1", how: "best of 1,000 tries, picked by a scoring model", percent: 93, solved: 13.9 },
] as const;

export function AimeDiagram() {
  return (
    <ol
      aria-label="Share of AIME 2024 maths problems solved"
      className="m-0 grid list-none gap-5 p-0"
    >
      {AIME.map((row) => (
        <li key={`${row.model}-${row.how}`} className="grid gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span>
              <span className="font-display text-label">{row.model}</span>{" "}
              <span className="text-small text-text-muted">{row.how}</span>
            </span>
            <span className="text-small">
              {row.percent}% ({row.solved} of 15)
            </span>
          </div>
          <div aria-hidden className="h-3 border-l border-border-strong">
            <div className="h-full rounded-r-sm bg-amber" style={{ width: `${row.percent}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Figure 1 as text, for the Markdown copy of the lesson (llms-full.txt). */
export const thinkingMarkdown = [
  `The question: ${BILL.question}`,
  "",
  "Thinking (in many apps, hidden or shown only as a summary):",
  "",
  ...BILL_STEPS.map((step) => `- ${step}`),
  "",
  `The answer: ${BILL_ANSWER}`,
].join("\n");

/** Figure 2 as text. */
export const aimeMarkdown = [
  "Share of the 15 AIME 2024 maths problems solved:",
  "",
  ...AIME.map((row) => `- ${row.model}, ${row.how}: ${row.percent}% (${row.solved} of 15)`),
].join("\n");
