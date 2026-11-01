import { FileStack, MessageSquareText } from "lucide-react";
import { type StepCard, StepCards, stepCardsMarkdown } from "./step-cards";

/*
 * Lesson 8, figure 1: the two halves of RAG. The documents are prepared once, ahead of
 * time; then every question goes through retrieve, augment and generate.
 */

export const RAG_STAGES: readonly StepCard[] = [
  {
    title: "Once, ahead of time",
    label: "Preparing the documents",
    icon: FileStack,
    steps: [
      {
        name: "Split",
        detail: "Cut every document into chunks, short passages a few hundred tokens long.",
      },
      {
        name: "Embed",
        detail: "Turn each chunk into an embedding, a list of numbers for its meaning.",
      },
      {
        name: "Store",
        detail: "Save the chunks and their embeddings in a vector database.",
      },
    ],
    result: "A library of your documents that can be searched by meaning.",
  },
  {
    title: "Every time someone asks",
    label: "Answering a question",
    icon: MessageSquareText,
    steps: [
      {
        name: "Retrieve",
        detail: "Turn the question into an embedding and find the closest chunks.",
      },
      {
        name: "Augment",
        detail: "Add those chunks to the prompt, with instructions to answer only from them.",
      },
      {
        name: "Generate",
        detail: "The LLM writes the answer from the chunks and points to the ones it used.",
      },
    ],
    result: "An answer based on your documents, with the passages you can check.",
  },
];

export function RagPipelineDiagram() {
  return <StepCards cards={RAG_STAGES} />;
}

/** The figure as text, for the Markdown copy of the lesson (llms-full.txt). */
export const ragPipelineMarkdown = stepCardsMarkdown(RAG_STAGES);
