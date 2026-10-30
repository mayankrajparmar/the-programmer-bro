/*
 * Lesson 1, figure 1: AI contains machine learning, which contains deep
 * learning, which contains generative AI. Drawn at phone size (360 wide) so
 * the labels stay readable when it scales down; colours are design tokens.
 */

const LAYERS = [
  { label: "Artificial intelligence", example: "e.g. rule-based expert systems" },
  { label: "Machine learning", example: "e.g. UPI fraud scores" },
  { label: "Deep learning", example: "e.g. voice typing, Google Lens" },
  { label: "Generative AI", example: "e.g. chatbots, image tools" },
];

/** The figure as text, for the Markdown copy of the lesson (llms-full.txt). */
export const aiLayersMarkdown = LAYERS.map(
  (layer, i) => `${"  ".repeat(i)}- ${layer.label} (${layer.example})`,
).join("\n");

const INSET = 16;
const LAYER_HEIGHT = 64;
const WIDTH = 360;
const HEIGHT = 320;

export function AiLayersDiagram() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label="Four nested boxes. Artificial intelligence contains machine learning, which contains deep learning, which contains generative AI."
      className="mx-auto block h-auto max-w-[440px]"
    >
      {LAYERS.map((layer, i) => {
        const x = i * INSET;
        const y = i * LAYER_HEIGHT;
        const innermost = i === LAYERS.length - 1;
        return (
          <g key={layer.label}>
            <rect
              x={x + 0.75}
              y={y + 0.75}
              width={WIDTH - 2 * x - 1.5}
              height={HEIGHT - y - i * INSET - 1.5}
              rx={16 - i * 2}
              strokeWidth={1.5}
              className={
                innermost
                  ? "fill-amber-subtle stroke-amber"
                  : i % 2 === 0
                    ? "fill-surface-raised stroke-border-strong"
                    : "fill-bg stroke-border-strong"
              }
            />
            <text
              x={x + 16}
              y={y + 28}
              className="fill-text font-display"
              fontSize={16}
              fontWeight={700}
            >
              {layer.label}
            </text>
            <text x={x + 16} y={y + 48} className="fill-text-muted font-body" fontSize={14}>
              {layer.example}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
