import GPT2 from "./gpt2-attention.json";

/*
 * Lesson 10, figure 3: inside one GPT-2 block, drawn the way papers and videos draw it.
 * The order of the parts comes from GPT-2's own graph (gpt2-attention.json, written by
 * scripts/lessons/gpt2-attention.py): normalise, attention, add back, normalise,
 * feed-forward, add back. The lines down the left are the shortcuts that add each part's
 * result to what came in. Colours are tokens; every label is text.
 */

const KINDS = ["normalise", "attention", "feed-forward", "add"] as const;
type Kind = (typeof KINDS)[number];

/** The parts in GPT-2's order, checked against the kinds this figure knows how to draw. */
export const BLOCK_ORDER: readonly Kind[] = GPT2.blockOrder.map((kind) => {
  if (!(KINDS as readonly string[]).includes(kind)) throw new Error(`Unknown block part: ${kind}`);
  return kind as Kind;
});

const grouped = (value: number) => value.toLocaleString("en-US");
const { model } = GPT2;

/** What each part is called in the figure, and the one-line detail under it. */
export const BLOCK_PARTS: Record<Kind, { name: string; detail: string }> = {
  normalise: { name: "Normalise", detail: "keeps the numbers in range" },
  attention: { name: "Attention", detail: `${model.heads} heads side by side` },
  "feed-forward": {
    name: "Feed-forward",
    detail: `${model.width} → ${grouped(model.mlp)} → ${model.width}`,
  },
  add: { name: "Add back", detail: "what came in + the change" },
};

const WIDTH = 360;
const CENTRE = 205;
const BOX = { width: 190, height: 46 };
const GAP = 22;
const ADD_R = 11;
const SHORTCUT_X = 52;
const TOP = 40;

interface Placed {
  kind: Kind;
  y: number;
  bottom: number;
  /** For "add": where its shortcut leaves the main line. */
  from?: number;
}

/** Lay the parts out top to bottom, remembering where each shortcut starts. */
function layout(): { parts: Placed[]; height: number } {
  const parts: Placed[] = [];
  let y = TOP;
  let segmentStart = TOP - GAP / 2;
  for (const kind of BLOCK_ORDER) {
    const size = kind === "add" ? ADD_R * 2 : BOX.height;
    parts.push({ kind, y, bottom: y + size, from: kind === "add" ? segmentStart : undefined });
    if (kind === "add") segmentStart = y + size + GAP / 2;
    y += size + GAP;
  }
  return { parts, height: y + 30 };
}

const { parts: PARTS, height: HEIGHT } = layout();

const LABEL = `One GPT-2 block, from top to bottom: ${PARTS.map(
  ({ kind }) => `${BLOCK_PARTS[kind].name.toLowerCase()} (${BLOCK_PARTS[kind].detail})`,
).join(
  ", ",
)}. Each "add back" adds that part's result to the numbers that came into it. GPT-2 stacks ${model.layers} of these blocks.`;

export function BlockDiagram() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label={LABEL}
      className="mx-auto block h-auto max-w-[480px]"
    >
      <defs>
        <marker
          id="block-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" className="fill-text-muted" />
        </marker>
      </defs>

      <text
        x={CENTRE}
        y={16}
        textAnchor="middle"
        fontSize={12}
        className="fill-text-muted font-body"
      >
        In: {model.width} numbers for each token
      </text>

      {/* The main line, from top to bottom. */}
      <line
        x1={CENTRE}
        y1={22}
        x2={CENTRE}
        y2={HEIGHT - 26}
        strokeWidth={1.5}
        markerEnd="url(#block-arrow)"
        className="stroke-text-muted"
      />

      {PARTS.map((part, i) => {
        if (part.kind === "add") {
          const cy = part.y + ADD_R;
          return (
            <g key={i}>
              <path
                d={`M${CENTRE},${part.from} H${SHORTCUT_X} V${cy} H${CENTRE - ADD_R - 2}`}
                fill="none"
                strokeWidth={1.5}
                markerEnd="url(#block-arrow)"
                className="stroke-text-muted"
              />
              <circle
                cx={CENTRE}
                cy={cy}
                r={ADD_R}
                strokeWidth={1.5}
                className="fill-surface-raised stroke-text-muted"
              />
              <text
                x={CENTRE}
                y={cy + 5}
                textAnchor="middle"
                fontSize={15}
                fontWeight={700}
                className="fill-text font-body"
              >
                +
              </text>
              <text x={CENTRE + 20} y={cy + 4} fontSize={11} className="fill-text-muted font-body">
                {BLOCK_PARTS.add.detail}
              </text>
            </g>
          );
        }
        const main = part.kind !== "normalise";
        return (
          <g key={i}>
            <rect
              x={CENTRE - BOX.width / 2}
              y={part.y}
              width={BOX.width}
              height={BOX.height}
              rx={8}
              strokeWidth={1.5}
              className={
                main ? "fill-amber-subtle stroke-amber" : "fill-surface-raised stroke-border-strong"
              }
            />
            <text
              x={CENTRE}
              y={part.y + 19}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              className="fill-text font-display"
            >
              {BLOCK_PARTS[part.kind].name}
            </text>
            <text
              x={CENTRE}
              y={part.y + 36}
              textAnchor="middle"
              fontSize={11}
              className="fill-text-muted font-body"
            >
              {BLOCK_PARTS[part.kind].detail}
            </text>
          </g>
        );
      })}

      <text
        x={CENTRE}
        y={HEIGHT - 6}
        textAnchor="middle"
        fontSize={12}
        className="fill-text-muted font-body"
      >
        Out: on to the next block ({model.layers} in GPT-2)
      </text>
    </svg>
  );
}

/** The figure as text, for the Markdown copy of the lesson (llms-full.txt). */
export const blockMarkdown = [
  "Inside one GPT-2 block, from top to bottom:",
  "",
  ...PARTS.map(({ kind }, i) => `${i + 1}. ${BLOCK_PARTS[kind].name}: ${BLOCK_PARTS[kind].detail}`),
  "",
  `Each "add back" adds that part's result to the numbers that came into it. GPT-2 stacks ${model.layers} of these blocks.`,
].join("\n");
