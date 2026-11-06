import { AudioLines, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { type StepCard, StepCards, stepCardsMarkdown } from "./step-cards";

/*
 * Lesson 14's figures. Figure 1 cuts a 224 × 224-pixel picture into 16 × 16-pixel patches,
 * the way the Vision Transformer does, and shows them joining the question's text tokens.
 * Figure 2 compares ChatGPT's old three-model Voice Mode with GPT-4o (OpenAI's numbers).
 * Figure 3 is a made-up agent run: a train search, a pause for approval, then a booking.
 * The sums are checked by a unit test. One colour; every value is text.
 */

/** The Vision Transformer's setup: a 224-pixel square image, 16-pixel patches (ViT-*-16). */
export const IMAGE = { size: 224, patch: 16 } as const;
export const PATCHES_PER_SIDE = IMAGE.size / IMAGE.patch;
export const PATCH_COUNT = PATCHES_PER_SIDE ** 2;

/** Is the patch in this row and column part of the (pixel-art) samosa? A triangle. */
export function inSamosa(row: number, column: number): boolean {
  const centre = (PATCHES_PER_SIDE - 1) / 2;
  return row >= 2 && row <= 11 && Math.abs(column - centre) <= 0.5 + (row - 2) * 0.6;
}

/** The text tokens of the question that follows the picture. */
export const QUESTION_TOKENS = ["What", " is", " in", " this", " photo", "?"] as const;

const CELL = 16;
const GRID = PATCHES_PER_SIDE * CELL;

export function PatchesDiagram() {
  const cells = Array.from({ length: PATCH_COUNT }, (_, index) => ({
    row: Math.floor(index / PATCHES_PER_SIDE),
    column: index % PATCHES_PER_SIDE,
  }));
  const shown = [1, 2, 3];
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,240px)_1fr]">
      <svg
        viewBox={`-1 -1 ${GRID + 2} ${GRID + 2}`}
        role="img"
        aria-label={`A ${IMAGE.size} by ${IMAGE.size} pixel picture of a samosa, cut into a grid of ${PATCHES_PER_SIDE} by ${PATCHES_PER_SIDE} patches, each ${IMAGE.patch} by ${IMAGE.patch} pixels`}
        className="w-full max-w-60"
      >
        {cells.map(({ row, column }) => (
          <rect
            key={`${row}-${column}`}
            x={column * CELL}
            y={row * CELL}
            width={CELL}
            height={CELL}
            className={cn(
              "stroke-border-strong",
              inSamosa(row, column) ? "fill-amber" : "fill-surface-raised",
            )}
            strokeWidth={0.5}
          />
        ))}
      </svg>
      <div className="grid gap-3">
        <p className="m-0 text-small">
          {IMAGE.size} × {IMAGE.size} pixels, cut into {IMAGE.patch} × {IMAGE.patch}-pixel patches:{" "}
          {PATCHES_PER_SIDE} rows of {PATCHES_PER_SIDE} ={" "}
          <strong className="font-semibold">{PATCH_COUNT} patches</strong>. Each one becomes a
          token.
        </p>
        <ol
          aria-label={`What the model reads: ${PATCH_COUNT} patch tokens, then the question “${QUESTION_TOKENS.join("")}”`}
          className="m-0 flex list-none flex-wrap items-center gap-2 p-0 font-mono text-code-small"
        >
          {shown.map((n) => (
            <li
              key={n}
              className="rounded-sm border border-amber bg-amber-subtle px-2 py-1 whitespace-nowrap"
            >
              patch {n}
            </li>
          ))}
          <li aria-hidden className="text-text-muted">
            …
          </li>
          <li className="rounded-sm border border-amber bg-amber-subtle px-2 py-1 whitespace-nowrap">
            patch {PATCH_COUNT}
          </li>
          {QUESTION_TOKENS.map((token) => (
            <li
              key={token}
              className="rounded-sm border border-border-strong bg-surface-raised px-2 py-1 whitespace-pre"
            >
              {token.startsWith(" ") && <span className="text-text-muted">·</span>}
              {token.trimStart()}
            </li>
          ))}
        </ol>
        <p className="m-0 text-caption text-text-muted">
          Amber: tokens from the picture. Grey: tokens from your question. A dot marks a space.
        </p>
      </div>
    </div>
  );
}

/** OpenAI's "Hello GPT-4o" (13 May 2024). */
export const VOICE_LATENCY = {
  pipelineSeconds: { "GPT-3.5": 2.8, "GPT-4": 5.4 },
  gpt4oMilliseconds: { fastest: 232, average: 320 },
} as const;

const VOICE: readonly StepCard[] = [
  {
    title: "Old Voice Mode: three models",
    label: "How ChatGPT's old Voice Mode answered",
    icon: Layers,
    steps: [
      { name: "Transcribe", detail: "A simple speech-to-text model writes down your words." },
      { name: "Reply", detail: "GPT-3.5 or GPT-4 reads that text and writes a reply as text." },
      { name: "Speak", detail: "A third simple model reads the reply aloud." },
    ],
    result: `A reply in ${VOICE_LATENCY.pipelineSeconds["GPT-3.5"]} seconds (GPT-3.5) or ${VOICE_LATENCY.pipelineSeconds["GPT-4"]} seconds (GPT-4) on average. Your tone, other speakers and background sounds are lost on the way.`,
  },
  {
    title: "GPT-4o: one model",
    label: "How GPT-4o answers",
    icon: AudioLines,
    steps: [
      { name: "Listen", detail: "Your voice goes straight into the model, tone and all." },
      {
        name: "Think",
        detail: "One model, trained on text, images and audio together, works on all of it.",
      },
      { name: "Speak", detail: "The same model replies with audio." },
    ],
    result: `A reply in as little as ${VOICE_LATENCY.gpt4oMilliseconds.fastest} milliseconds, ${VOICE_LATENCY.gpt4oMilliseconds.average} on average, close to how quickly people reply in a conversation.`,
  },
];

export function VoiceDiagram() {
  return <StepCards cards={VOICE} />;
}

/** A made-up agent run. The trains, times and fares are invented. */
export const TRAINS = [
  { name: "Morning Express", departs: "06:10", fare: 1150 },
  { name: "Garden City Express", departs: "07:30", fare: 980 },
  { name: "Coastal Express", departs: "09:15", fare: 1045 },
] as const;

export const CHEAPEST = TRAINS.reduce((best, train) => (train.fare < best.fare ? train : best));

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

type Who = "You" | "Model" | "App";

export const AGENT_RUN: readonly { who: Who; kind: string; text: string }[] = [
  {
    who: "You",
    kind: "ask",
    text: "Find the cheapest train from Bengaluru to Chennai on Saturday morning. Ask me before you book.",
  },
  {
    who: "Model",
    kind: "calls a tool",
    text: 'search_trains({"from": "Bengaluru", "to": "Chennai", "date": "Saturday", "before": "12:00"})',
  },
  {
    who: "App",
    kind: "returns the result",
    text: TRAINS.map((train) => `${train.name}, ${train.departs}, ${rupees(train.fare)}`).join(
      " · ",
    ),
  },
  {
    who: "Model",
    kind: "checks with you",
    text: `The cheapest is the ${CHEAPEST.name} at ${CHEAPEST.departs}, for ${rupees(CHEAPEST.fare)}. Shall I book it?`,
  },
  { who: "You", kind: "approve", text: "Yes, book it." },
  {
    who: "Model",
    kind: "calls a tool",
    text: `book_ticket({"train": "${CHEAPEST.name}", "date": "Saturday"})`,
  },
  { who: "App", kind: "returns the result", text: '{"status": "booked"}' },
  {
    who: "Model",
    kind: "answers",
    text: `Done: you're booked on the ${CHEAPEST.departs} ${CHEAPEST.name} on Saturday.`,
  },
];

export function AgentRunDiagram() {
  return (
    <ol aria-label="A made-up agent run, step by step" className="m-0 grid list-none gap-2 p-0">
      {AGENT_RUN.map((step, index) => (
        <li
          key={index}
          className={cn(
            "grid gap-1 rounded-md border p-3 sm:grid-cols-[132px_1fr] sm:gap-3",
            step.who === "Model"
              ? "border-amber bg-amber-subtle"
              : step.who === "App"
                ? "border-dashed border-border-strong bg-surface"
                : "border-border bg-surface-raised",
          )}
        >
          <p className="m-0 text-small">
            <span className="font-display text-label">{step.who}</span>{" "}
            <span className="text-text-muted">{step.kind}</span>
          </p>
          <p
            className={cn(
              "m-0 min-w-0 text-small break-words",
              (step.kind === "calls a tool" || step.text.startsWith("{")) &&
                "font-mono text-code-small",
            )}
          >
            {step.text}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Figure 1 as text, for the Markdown copy of the lesson (llms-full.txt). */
export const patchesMarkdown = [
  `A ${IMAGE.size} × ${IMAGE.size}-pixel picture of a samosa, cut into ${IMAGE.patch} × ${IMAGE.patch}-pixel patches: ${PATCHES_PER_SIDE} rows of ${PATCHES_PER_SIDE} = ${PATCH_COUNT} patches, each one a token.`,
  "",
  `What the model reads: patch 1, patch 2, patch 3, …, patch ${PATCH_COUNT}, then the text tokens ${QUESTION_TOKENS.map((t) => `“${t}”`).join(", ")}.`,
].join("\n");

/** Figure 2 as text. */
export const voiceMarkdown = stepCardsMarkdown(VOICE);

/** Figure 3 as text. */
export const agentRunMarkdown = [
  "A made-up agent run:",
  "",
  ...AGENT_RUN.map((step, index) => `${index + 1}. ${step.who} ${step.kind}: ${step.text}`),
].join("\n");
