import type { LucideIcon } from "lucide-react";

/*
 * Cards of numbered steps, side by side on wide screens and stacked on phones, each
 * ending with what you get. Used by figures that walk through a process (lesson 6's
 * search engine vs LLM, lesson 8's RAG pipeline). Lists, so screen readers read the
 * steps in order; colours are design tokens.
 */

export interface StepCard {
  title: string;
  /** Names the card for screen readers, e.g. "How a search engine answers". */
  label: string;
  icon: LucideIcon;
  steps: readonly { name: string; detail: string }[];
  result: string;
}

export function StepCards({ cards }: { cards: readonly StepCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map(({ title, label, icon: Icon, steps, result }) => (
        <section
          key={title}
          aria-label={label}
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

/** The cards as text, for the Markdown copy of a lesson (llms-full.txt). */
export function stepCardsMarkdown(cards: readonly StepCard[]): string {
  return cards
    .map(({ title, steps, result }) =>
      [
        `${title}:`,
        ...steps.map((step, index) => `${index + 1}. ${step.name}: ${step.detail}`),
        `You get: ${result}`,
      ].join("\n"),
    )
    .join("\n\n");
}
