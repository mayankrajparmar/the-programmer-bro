import { BookOpen, Search } from "lucide-react";

/*
 * Lesson 6, figure 1: how a search engine and an LLM each answer a question, as two
 * cards of three steps, side by side on wide screens and stacked on phones. Lists,
 * so screen readers read the steps in order; colours are design tokens.
 */

interface Path {
  title: string;
  icon: typeof Search;
  steps: readonly { name: string; detail: string }[];
  result: string;
}

const PATHS: readonly Path[] = [
  {
    title: "Search engine",
    icon: Search,
    steps: [
      {
        name: "Crawl",
        detail: "Programs called crawlers download pages from across the web, again and again.",
      },
      {
        name: "Index",
        detail: "Each page is analysed and stored in a huge database, like a book's index.",
      },
      {
        name: "Rank",
        detail: "Your question is matched against the index, and the best pages come first.",
      },
    ],
    result: "Links to pages that already exist, including ones published today.",
  },
  {
    title: "LLM",
    icon: BookOpen,
    steps: [
      {
        name: "Train",
        detail: "It learns patterns from a huge pile of text, up to its knowledge cutoff.",
      },
      {
        name: "Predict",
        detail: "It writes an answer one token at a time, picking what's likely to come next.",
      },
      {
        name: "Reply",
        detail: "The new text arrives in a confident, fluent voice, right or wrong.",
      },
    ],
    result: "Brand-new text, with no links unless the app adds a search step.",
  },
];

export function SearchVsLlmDiagram() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PATHS.map(({ title, icon: Icon, steps, result }) => (
        <section
          key={title}
          aria-label={`How ${title === "LLM" ? "an LLM" : "a search engine"} answers`}
          className="grid content-start gap-3 rounded-md border border-border bg-surface-raised p-4"
        >
          <h3 className="m-0 flex items-center gap-2 font-display text-label">
            <Icon aria-hidden className="size-5 text-accent-text" />
            {title}
          </h3>
          <ol className="m-0 grid list-none gap-3 p-0">
            {steps.map((step, index) => (
              <li key={step.name} className="grid grid-cols-[28px_1fr] gap-x-3">
                <span
                  aria-hidden
                  className="flex size-7 items-center justify-center rounded-pill bg-amber-subtle font-display text-label text-accent-text"
                >
                  {index + 1}
                </span>
                <span className="text-small">
                  <strong className="font-semibold">{step.name}.</strong> {step.detail}
                </span>
              </li>
            ))}
          </ol>
          <p className="m-0 border-t border-border pt-3 text-small">
            <strong className="font-semibold">You get:</strong> {result}
          </p>
        </section>
      ))}
    </div>
  );
}

/** The figure as text, for the Markdown copy of the lesson (llms-full.txt). */
export const searchVsLlmMarkdown = PATHS.map(({ title, steps, result }) =>
  [
    `${title}:`,
    ...steps.map((step, index) => `${index + 1}. ${step.name}: ${step.detail}`),
    `You get: ${result}`,
  ].join("\n"),
).join("\n\n");
