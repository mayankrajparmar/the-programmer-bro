import { Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Lesson 2, figure 1: AI's big moments from 1950 to today, with the two AI
 * winters marked. An ordered list rather than an SVG, so it reflows on a phone
 * and screen readers read it as a list; colours are design tokens.
 */

interface Moment {
  when: string;
  what: string;
  winter?: boolean;
}

const AI_MOMENTS: readonly Moment[] = [
  { when: "1950", what: "Alan Turing asks “Can machines think?”" },
  { when: "1956", what: "The Dartmouth workshop gives AI its name" },
  { when: "1958", what: "The perceptron, an early neural network, learns from examples" },
  { when: "1966", what: "ELIZA, one of the first chatbots" },
  { when: "Mid-1970s", what: "First AI winter: money and interest dry up", winter: true },
  { when: "1980s", what: "Expert systems boom, built from hand-written rules" },
  { when: "Late 1980s", what: "Second AI winter, lasting into the early 1990s", winter: true },
  { when: "1997", what: "Deep Blue beats Garry Kasparov at chess" },
  { when: "2012", what: "AlexNet wins ImageNet, and deep learning takes off" },
  { when: "2016", what: "AlphaGo beats Lee Sedol at Go" },
  { when: "2017", what: "Google researchers introduce the Transformer" },
  { when: "2022", what: "OpenAI releases ChatGPT" },
  { when: "2024 onwards", what: "Reasoning models, then agents" },
];

export function AiTimelineDiagram() {
  return (
    <ol aria-label="Timeline of AI from 1950 to today" className="m-0 list-none p-0">
      {AI_MOMENTS.map(({ when, what, winter }, index) => (
        <li key={when} className="relative grid grid-cols-[24px_1fr] gap-x-3">
          {/* The line joining each moment to the next. */}
          <span
            aria-hidden
            className={cn(
              "absolute left-[11px] w-0.5 bg-border-strong",
              index === 0 ? "top-3" : "top-0",
              index === AI_MOMENTS.length - 1 ? "h-3" : "bottom-0",
            )}
          />
          <span aria-hidden className="relative flex h-6 items-center justify-center">
            {winter ? (
              <span className="flex size-6 items-center justify-center rounded-pill bg-surface">
                <Snowflake className="size-4 text-info" />
              </span>
            ) : (
              <span className="size-3 rounded-pill bg-amber ring-4 ring-surface" />
            )}
          </span>
          <div className={cn("min-w-0", index < AI_MOMENTS.length - 1 && "pb-4")}>
            <div className={cn(winter && "-mt-1.5 rounded-md bg-info-subtle px-3 py-1.5")}>
              <span
                className={cn(
                  "block font-display text-label",
                  winter ? "text-info" : "text-accent-text",
                )}
              >
                {when}
              </span>
              <span className="block text-small text-text">{what}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
