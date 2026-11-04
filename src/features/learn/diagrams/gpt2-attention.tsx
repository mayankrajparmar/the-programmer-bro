import { Flow, type FlowStage, flowMarkdown } from "./flow";
import GPT2 from "./gpt2-attention.json";

/*
 * Lesson 10's figures, from real GPT-2 numbers (scripts/lessons/gpt2-attention.py writes
 * gpt2-attention.json). Figure 1: the journey of a prompt through the model, with
 * GPT-2's sizes. Figure 2: one attention head's attention from "it" and from "she" to
 * every earlier token, as bars on one 0-100% scale. One colour; every value is text.
 */

export { GPT2 };

type Pronoun = keyof typeof GPT2.sentences;

/** The tokens each pronoun is meant to find. */
export const TARGETS: Record<Pronoun, { name: string; tokens: readonly string[] }> = {
  it: { name: "suitcase", tokens: [" suitcase"] },
  she: { name: "Riya", tokens: [" R", "iya"] },
};

/** The pronoun's attention to its target, adding up the target's tokens. */
export function targetShare(pronoun: Pronoun): number {
  const { tokens, percent } = GPT2.sentences[pronoun];
  const total = tokens.reduce(
    (sum, token, i) => (TARGETS[pronoun].tokens.includes(token) ? sum + (percent[i] ?? 0) : sum),
    0,
  );
  return Math.round(total * 10) / 10;
}

const grouped = (value: number) => value.toLocaleString("en-US");
const { model } = GPT2;
const HEAD = `layer ${GPT2.head.layer}, head ${GPT2.head.head}`;

const STEPS: readonly FlowStage[] = [
  {
    name: "Text to tokens",
    detail: `Your prompt is split into tokens, each with an ID (lesson 5). GPT-2 knows ${grouped(model.vocab)} different tokens.`,
  },
  {
    name: "Tokens to embeddings",
    detail: `Each token becomes a list of ${model.width} numbers (lesson 7), plus a second list that marks its position in the text.`,
  },
  {
    name: "Transformer blocks",
    badge: `× ${model.layers}`,
    highlight: true,
    detail: `The same kind of block, repeated ${model.layers} times in GPT-2. Each one has two parts:`,
    parts: [
      {
        name: "Attention",
        detail: "each token gathers information from the tokens before it.",
      },
      {
        name: "Feed-forward",
        detail: `each token's numbers go through a small neural network on their own (lesson 9), ${model.width} numbers in, ${grouped(model.mlp)} neurons, ${model.width} numbers out.`,
      },
    ],
  },
  {
    name: "Scores to the next token",
    detail: `The last token's numbers become a probability for each of the ${grouped(model.vocab)} tokens, and one is picked (lesson 4). It's added to the text, and the journey starts again.`,
  },
];

export function TransformerPipelineDiagram() {
  return <Flow label="The journey of a prompt through GPT-2" stages={STEPS} />;
}

/** A token as lesson 5 draws it: a faint dot for a space at the start. */
function Token({ text }: { text: string }) {
  return (
    <span className="font-mono text-code-small whitespace-pre">
      {text.startsWith(" ") && (
        <span aria-hidden className="text-text-muted">
          ·
        </span>
      )}
      {text.trimStart()}
    </span>
  );
}

function AttentionFrom({ pronoun }: { pronoun: Pronoun }) {
  const { tokens, percent } = GPT2.sentences[pronoun];
  const target = TARGETS[pronoun];
  return (
    <section
      aria-label={`Attention from ${pronoun}`}
      className="grid content-start gap-3 rounded-md border border-border bg-surface-raised p-4"
    >
      <h3 className="m-0 font-display text-label">From “{pronoun}”</h3>
      <ol className="m-0 grid list-none gap-1.5 p-0">
        {tokens.map((token, i) => {
          const isTarget = target.tokens.includes(token);
          return (
            <li key={i} className="grid grid-cols-[5.5rem_1fr_3.25rem] items-center gap-2">
              <span className={isTarget ? "font-semibold" : undefined}>
                <Token text={token} />
              </span>
              <span aria-hidden className="h-2.5 border-l border-border-strong">
                <span
                  className="block h-full rounded-r-sm bg-amber"
                  style={{ width: `${percent[i] ?? 0}%` }}
                />
              </span>
              <span className="text-right text-small">{(percent[i] ?? 0).toFixed(1)}%</span>
            </li>
          );
        })}
      </ol>
      <p className="m-0 border-t border-border pt-3 text-small">
        <strong className="font-semibold">To {target.name}:</strong>{" "}
        {targetShare(pronoun).toFixed(1)}%
        {target.tokens.length > 1 && ` (${target.tokens.map((t) => t.trim()).join(" + ")})`}
      </p>
    </section>
  );
}

/** Figure 2: one GPT-2 head's attention from "it" and from "she". */
export function AttentionDiagram() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AttentionFrom pronoun="it" />
      <AttentionFrom pronoun="she" />
    </div>
  );
}

/** Figure 1 as text, for the Markdown copy of the lesson (llms-full.txt). */
export const transformerPipelineMarkdown = flowMarkdown(STEPS);

/** Figure 2 as text. */
export const attentionMarkdown = (Object.keys(GPT2.sentences) as Pronoun[])
  .map((pronoun) => {
    const { text, tokens, percent } = GPT2.sentences[pronoun];
    const shares = tokens
      .map((token, i) => `"${token.trim()}" ${(percent[i] ?? 0).toFixed(1)}%`)
      .join(", ");
    return `- "${text}" In GPT-2's ${HEAD}, attention from "${pronoun}": ${shares}. To ${TARGETS[pronoun].name}: ${targetShare(pronoun).toFixed(1)}%.`;
  })
  .join("\n");
