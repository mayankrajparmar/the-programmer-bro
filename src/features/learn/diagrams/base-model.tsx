import BASE from "./base-model.json";
import { Flow, type FlowStage, flowMarkdown } from "./flow";

/*
 * Lesson 12's figures. Figures 1 and 2 show what GPT-2, a base model, really writes after
 * a question, an instruction and a quiz-style pattern (scripts/lessons/base-model.py writes
 * base-model.json, always picking the most likely token). Figure 3 is the three training
 * stages from base model to assistant, with InstructGPT's numbers.
 */

export { BASE };

type PromptName = keyof typeof BASE.prompts;

function Exchange({ name, title }: { name: PromptName; title: string }) {
  const { prompt, continuation } = BASE.prompts[name];
  return (
    <section
      aria-label={title}
      className="grid content-start gap-3 rounded-md border border-border bg-surface-raised p-4"
    >
      <h3 className="m-0 font-display text-label">{title}</h3>
      <div className="grid gap-1">
        <p className="m-0 text-caption text-text-muted">You type</p>
        <p className="m-0 rounded-sm border border-border bg-surface px-3 py-2 font-mono text-code-small whitespace-pre-wrap">
          {prompt}
        </p>
      </div>
      <div className="grid gap-1">
        <p className="m-0 text-caption text-text-muted">
          GPT-2 continues (first {BASE.tokens} tokens)
        </p>
        <p className="m-0 rounded-sm border border-amber bg-amber-subtle px-3 py-2 font-mono text-code-small whitespace-pre-wrap">
          {continuation.trim()}…
        </p>
      </div>
    </section>
  );
}

/** Figure 1: a question and an instruction, as GPT-2 continues them. */
export function BaseModelDiagram() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Exchange name="question" title="A question" />
      <Exchange name="instruction" title="An instruction" />
    </div>
  );
}

/** Figure 2: a quiz-style pattern, with GPT-2's top guesses for the answer. */
export function BasePatternDiagram() {
  const { top } = BASE.prompts.pattern;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Exchange name="pattern" title="A pattern to copy" />
      <section
        aria-label="GPT-2's top guesses for the answer"
        className="grid content-start gap-3 rounded-md border border-border bg-surface-raised p-4"
      >
        <h3 className="m-0 font-display text-label">Its top guesses for the answer</h3>
        <ol className="m-0 grid list-none gap-1.5 p-0">
          {top.map((token) => (
            <li key={token.text} className="grid grid-cols-[6rem_1fr_3.25rem] items-center gap-2">
              <span className="text-small">{token.text.trim()}</span>
              <span aria-hidden className="h-2.5 border-l border-border-strong">
                <span
                  className="block h-full rounded-r-sm bg-amber"
                  style={{ width: `${token.percent * 2}%` }}
                />
              </span>
              <span className="text-right text-small">{token.percent.toFixed(1)}%</span>
            </li>
          ))}
        </ol>
        <p className="m-0 border-t border-border pt-3 text-small text-text-muted">
          Bars are drawn on a 0–50% scale.
        </p>
      </section>
    </div>
  );
}

/** The three stages, with the numbers from OpenAI's InstructGPT paper (2022). */
export const TRAINING_STAGES: readonly FlowStage[] = [
  {
    name: "Pre-training",
    detail:
      "The model learns to continue text from a huge pile of it (lesson 11). GPT-3 learned from 300 billion tokens (lesson 3).",
    result: "a base model, which continues whatever you give it.",
  },
  {
    name: "Supervised fine-tuning",
    detail:
      "People write example prompts and the ideal answers, and the model is trained on them in the same way. InstructGPT used about 13,000 prompts.",
    result: "a model that answers questions and follows instructions.",
    highlight: true,
  },
  {
    name: "Learning from preferences",
    detail:
      "The model writes several answers to a prompt, people rank them, and the model is nudged towards the kind of answer people prefer. InstructGPT used rankings for about 33,000 prompts.",
    result: "an assistant whose answers people find more helpful.",
    highlight: true,
  },
];

/** Figure 3: from base model to assistant. */
export function TrainingStagesDiagram() {
  return <Flow label="From base model to assistant" stages={TRAINING_STAGES} />;
}

const exchangeMarkdown = (name: PromptName) => {
  const { prompt, continuation } = BASE.prompts[name];
  return [
    "You type:",
    "",
    "```text",
    prompt,
    "```",
    "",
    `GPT-2 continues (first ${BASE.tokens} tokens):`,
    "",
    "```text",
    `${continuation.trim()}…`,
    "```",
  ].join("\n");
};

/** Figure 1 as text, for the Markdown copy of the lesson (llms-full.txt). */
export const baseModelMarkdown = [
  exchangeMarkdown("question"),
  exchangeMarkdown("instruction"),
].join("\n\n");

/** Figure 2 as text. */
export const basePatternMarkdown = [
  exchangeMarkdown("pattern"),
  "",
  `Its top guesses for the answer: ${BASE.prompts.pattern.top
    .map((token) => `${token.text.trim()} ${token.percent.toFixed(1)}%`)
    .join(", ")}.`,
].join("\n");

/** Figure 3 as text. */
export const trainingStagesMarkdown = flowMarkdown(TRAINING_STAGES);
