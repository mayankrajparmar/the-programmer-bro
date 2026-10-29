import { delay } from "@/lib/motion";
import { cn } from "@/lib/utils";

/*
 * "Your Swiggy order is 5 minutes away" being split into tokens: the teaser
 * for Track 1's tokens lesson. Two layouts from the page designs, a wide one
 * from 640px and a narrow one for phones, so the text stays legible.
 */

const SENTENCE = "Your Swiggy order is 5 minutes away";

/** Token text and box width in SVG units (JetBrains Mono 15px plus padding). */
const ROWS: [string, number][][] = [
  [
    ["Your", 64],
    ["Sw", 46],
    ["iggy", 64],
    ["order", 73],
  ],
  [
    ["is", 46],
    ["5", 37],
    ["minutes", 91],
    ["away", 64],
  ],
];

const TOKEN_COUNT = ROWS.flat().length;

const LABEL = `The sentence '${SENTENCE}' goes through a tokenizer and comes out as ${TOKEN_COUNT} tokens: ${ROWS.flat()
  .map(([text]) => text)
  .join(", ")}.`;

export interface Layout {
  width: number;
  inputInset: number;
  sentenceSize: number;
  sentenceY: number;
  gap: number;
  caption: string;
}

export const WIDE: Layout = {
  width: 520,
  inputInset: 40,
  sentenceSize: 18,
  sentenceY: 56,
  gap: 10,
  caption: `${TOKEN_COUNT} tokens, each one a number the model reads`,
};

export const NARROW: Layout = {
  width: 340,
  inputInset: 20,
  sentenceSize: 16,
  sentenceY: 55,
  gap: 8,
  caption: `${TOKEN_COUNT} tokens, each one a number`,
};

/** Centres each row of token boxes; alternate tokens are highlighted. */
export function placeTokens(layout: Layout) {
  const mid = layout.width / 2;
  return ROWS.flatMap((row, rowIndex) => {
    const rowWidth = row.reduce((sum, [, width]) => sum + width, 0) + layout.gap * (row.length - 1);
    const lefts = row.map(
      (_, i) =>
        mid - rowWidth / 2 + row.slice(0, i).reduce((sum, [, w]) => sum + w + layout.gap, 0),
    );
    const before = ROWS.slice(0, rowIndex).flat().length;
    return row.map(([text, width], i) => ({
      index: before + i,
      text,
      width,
      x: lefts[i] ?? 0,
      y: 134 + rowIndex * 50,
    }));
  });
}

function Diagram({ layout, className }: { layout: Layout; className?: string }) {
  const mid = layout.width / 2;

  return (
    <svg
      viewBox={`0 0 ${layout.width} 256`}
      width="100%"
      role="img"
      aria-label={LABEL}
      className={cn("h-auto", className)}
    >
      <rect
        x={layout.inputInset}
        y={24}
        width={layout.width - layout.inputInset * 2}
        height={52}
        rx={10}
        className="fill-surface-raised stroke-border"
        strokeWidth={1}
      />
      <text
        x={mid}
        y={layout.sentenceY}
        textAnchor="middle"
        className="tpb-type fill-text font-body"
        fontSize={layout.sentenceSize}
      >
        {SENTENCE}
      </text>

      <path
        d={`M${mid} 86V118`}
        className="tpb-draw fill-none stroke-text-muted"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d={`M${mid - 7} 111L${mid} 119L${mid + 7} 111`}
        className="tpb-fade fill-none stroke-text-muted"
        style={delay(2)}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={mid + 14}
        y={107}
        className="tpb-fade fill-text-muted font-mono"
        style={delay(1.8)}
        fontSize={13}
      >
        tokenizer
      </text>

      {placeTokens(layout).map((token) => (
        <g key={token.index} className="tpb-tok" style={delay(2.3 + token.index * 0.1)}>
          <rect
            x={token.x}
            y={token.y}
            width={token.width}
            height={40}
            rx={6}
            strokeWidth={1.5}
            className={
              token.index % 2 === 0
                ? "fill-amber-subtle stroke-amber"
                : "fill-surface-raised stroke-border-strong"
            }
          />
          <text
            x={token.x + token.width / 2}
            y={token.y + 25}
            textAnchor="middle"
            className="fill-text font-mono"
            fontSize={15}
          >
            {token.text}
          </text>
        </g>
      ))}

      <text
        x={mid}
        y={250}
        textAnchor="middle"
        className="tpb-fade fill-text font-display"
        style={delay(3.3)}
        fontSize={14}
        fontWeight={600}
      >
        {layout.caption}
      </text>
    </svg>
  );
}

export function TokenDemo({
  caption,
  className,
  style,
}: {
  /** Optional note under the diagram. */
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <figure
      className={cn(
        "m-0 grid w-full max-w-[340px] gap-3 rounded-lg border border-border bg-surface p-3",
        "sm:max-w-[440px] sm:p-4",
        className,
      )}
      style={style}
    >
      <Diagram layout={NARROW} className="block sm:hidden" />
      <Diagram layout={WIDE} className="hidden sm:block" />
      {caption && <figcaption className="text-caption text-text-muted">{caption}</figcaption>}
    </figure>
  );
}
