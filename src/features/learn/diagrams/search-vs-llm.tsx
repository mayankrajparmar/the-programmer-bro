import { BookOpen, Search } from "lucide-react";
import { type StepCard, StepCards, stepCardsMarkdown } from "./step-cards";

/*
 * Lesson 6, figure 1: how a search engine and an LLM each answer a question, as two
 * cards of three steps.
 */

const PATHS: readonly StepCard[] = [
  {
    title: "Search engine",
    label: "How a search engine answers",
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
    label: "How an LLM answers",
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
  return <StepCards cards={PATHS} />;
}

/** The figure as text, for the Markdown copy of the lesson (llms-full.txt). */
export const searchVsLlmMarkdown = stepCardsMarkdown(PATHS);
