/*
 * Lesson 7, figure 1: twelve words placed by meaning. Each word's 100-number GloVe
 * embedding was squashed to two numbers with PCA (scripts/lessons/glove-embeddings.py),
 * so the groups are real but the exact distances are only approximate. One colour for
 * every dot; the words and group names carry the meaning, not the colour.
 */

export type MeaningGroup = "Food" | "Sport" | "Tech";

interface Point {
  word: string;
  group: MeaningGroup;
  /** Position from the PCA, scaled to 0–100 on each axis (y grows upwards). */
  x: number;
  y: number;
  /** Where the word sits next to its dot, so crowded labels don't collide. */
  label: "left" | "right" | "above" | "below";
}

export const MEANING_MAP: readonly Point[] = [
  { word: "dosa", group: "Food", x: 2.4, y: 65.2, label: "above" },
  { word: "idli", group: "Food", x: 0, y: 50.1, label: "below" },
  { word: "biryani", group: "Food", x: 19.8, y: 59, label: "right" },
  { word: "samosa", group: "Food", x: 8.9, y: 47.3, label: "right" },
  { word: "cricket", group: "Sport", x: 85.6, y: 95.3, label: "left" },
  { word: "hockey", group: "Sport", x: 92.9, y: 100, label: "above" },
  { word: "football", group: "Sport", x: 100, y: 94.2, label: "below" },
  { word: "kabaddi", group: "Sport", x: 46.4, y: 77.5, label: "right" },
  { word: "laptop", group: "Tech", x: 76.6, y: 0, label: "left" },
  { word: "computer", group: "Tech", x: 90, y: 3.6, label: "above" },
  { word: "software", group: "Tech", x: 83.3, y: 1.4, label: "below" },
  { word: "smartphone", group: "Tech", x: 53.8, y: 6.5, label: "left" },
];

const WIDTH = 360;
const HEIGHT = 300;
const LEFT = 40;
const RIGHT = 316;
const TOP = 40;
const BOTTOM = 252;

const px = (x: number) => LEFT + (x / 100) * (RIGHT - LEFT);
const py = (y: number) => BOTTOM - (y / 100) * (BOTTOM - TOP);

const LABEL_OFFSET = {
  left: { dx: -9, dy: 4, anchor: "end" },
  right: { dx: 9, dy: 4, anchor: "start" },
  above: { dx: 0, dy: -10, anchor: "middle" },
  below: { dx: 0, dy: 18, anchor: "middle" },
} as const;

/** Where each group's name goes, near its cluster. */
const GROUP_LABELS: readonly { group: MeaningGroup; x: number; y: number }[] = [
  { group: "Food", x: 62, y: 190 },
  { group: "Sport", x: 268, y: 106 },
  { group: "Tech", x: 250, y: 214 },
];

const listWords = (group: MeaningGroup) =>
  MEANING_MAP.filter((point) => point.group === group)
    .map((point) => point.word)
    .join(", ");

const LABEL = `A map of twelve words placed by meaning. Food words (${listWords("Food")}) sit together on the left. Sport words (${listWords("Sport")}) sit at the top right, with kabaddi a little apart from the others. Tech words (${listWords("Tech")}) sit at the bottom right.`;

export function MeaningMapDiagram() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label={LABEL}
      className="mx-auto block h-auto max-w-[560px]"
    >
      <rect
        x={0.75}
        y={0.75}
        width={WIDTH - 1.5}
        height={HEIGHT - 1.5}
        rx={12}
        strokeWidth={1.5}
        className="fill-surface-raised stroke-border"
      />
      {GROUP_LABELS.map(({ group, x, y }) => (
        <text
          key={group}
          x={x}
          y={y}
          textAnchor="middle"
          className="fill-text-muted font-display"
          fontSize={12}
          fontWeight={700}
          letterSpacing={1}
        >
          {group.toUpperCase()}
        </text>
      ))}
      {MEANING_MAP.map((point) => {
        const cx = px(point.x);
        const cy = py(point.y);
        const offset = LABEL_OFFSET[point.label];
        return (
          <g key={point.word}>
            <circle
              cx={cx}
              cy={cy}
              r={5}
              strokeWidth={2}
              className="fill-amber stroke-surface-raised"
            />
            <text
              x={cx + offset.dx}
              y={cy + offset.dy}
              textAnchor={offset.anchor}
              className="fill-text font-body"
              fontSize={13}
            >
              {point.word}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** The figure as text, for the Markdown copy of the lesson (llms-full.txt). */
export const meaningMapMarkdown = [
  "Twelve words placed by meaning (GloVe embeddings squashed to two dimensions):",
  "",
  `- Food, on the left: ${listWords("Food")}`,
  `- Sport, at the top right: ${listWords("Sport")} (kabaddi sits a little apart)`,
  `- Tech, at the bottom right: ${listWords("Tech")}`,
].join("\n");
