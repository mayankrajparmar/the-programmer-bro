/*
 * Lesson 9, figure 1: one made-up neuron deciding whether to buy chai. Three yes/no
 * inputs, each multiplied by its weight, added to the bias; a total above 0 means yes.
 * The weights and the inputs shown are the lesson's first example. Colours are tokens;
 * the weights are written as text, never shown by colour alone.
 */

interface Input {
  label: string;
  weight: number;
}

export const CHAI_NEURON: { inputs: readonly Input[]; bias: number } = {
  inputs: [
    { label: "It's raining", weight: 2 },
    { label: "You're tired", weight: 3 },
    { label: "You're short of cash", weight: -4 },
  ],
  bias: -1,
};

/** The figure's example: raining, tired, not short of cash. */
export const CHAI_EXAMPLE = [1, 1, 0] as const;

/** Each input times its weight, plus the bias. */
export function chaiTotal(values: readonly number[]): number {
  return CHAI_NEURON.inputs.reduce<number>(
    (sum, input, i) => sum + input.weight * (values[i] ?? 0),
    CHAI_NEURON.bias,
  );
}

/** The neuron's rule: yes when the total is above 0. */
export const buysChai = (values: readonly number[]) => chaiTotal(values) > 0;

/** Signed numbers with a real minus sign, as the lesson writes them. */
export const signed = (value: number) => (value < 0 ? `−${Math.abs(value)}` : `${value}`);

const WIDTH = 400;
const HEIGHT = 230;
const BOX = { x: 8, width: 128, height: 46 };
const BOX_TOPS = [16, 92, 168];
const NEURON = { x: 262, y: 115, r: 44 };

const total = chaiTotal(CHAI_EXAMPLE);
const answer = buysChai(CHAI_EXAMPLE) ? "Yes" : "No";

const LABEL = `A neuron with three inputs. It's raining: yes, 1, with weight 2. You're tired: yes, 1, with weight 3. You're short of cash: no, 0, with weight ${signed(CHAI_NEURON.inputs[2]?.weight ?? 0)}. The bias is ${signed(CHAI_NEURON.bias)}. The total is ${total}, which is above 0, so the answer is ${answer.toLowerCase()}, buy chai.`;

export function NeuronDiagram() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label={LABEL}
      className="mx-auto block h-auto max-w-[560px]"
    >
      <defs>
        <marker
          id="neuron-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" className="fill-text-muted" />
        </marker>
      </defs>
      {CHAI_NEURON.inputs.map((input, i) => {
        const top = BOX_TOPS[i] ?? 0;
        const cy = top + BOX.height / 2;
        const x1 = BOX.x + BOX.width;
        // End the line on the circle's edge, pointing at its centre.
        const dx = NEURON.x - x1;
        const dy = NEURON.y - cy;
        const length = Math.hypot(dx, dy);
        const x2 = NEURON.x - (dx / length) * NEURON.r;
        const y2 = NEURON.y - (dy / length) * NEURON.r;
        const mx = x1 + (x2 - x1) * 0.45;
        const my = cy + (y2 - cy) * 0.45;
        const value = CHAI_EXAMPLE[i] ?? 0;
        return (
          <g key={input.label}>
            <rect
              x={BOX.x}
              y={top}
              width={BOX.width}
              height={BOX.height}
              rx={8}
              strokeWidth={1.5}
              className="fill-surface-raised stroke-border-strong"
            />
            <text x={BOX.x + 12} y={top + 19} fontSize={12} className="fill-text-muted font-body">
              {input.label}
            </text>
            <text
              x={BOX.x + 12}
              y={top + 37}
              fontSize={14}
              fontWeight={600}
              className="fill-text font-body"
            >
              {value ? "Yes" : "No"} = {value}
            </text>
            <line
              x1={x1}
              y1={cy}
              x2={x2}
              y2={y2}
              strokeWidth={1.5}
              className="stroke-border-strong"
            />
            <rect
              x={mx - 19}
              y={my - 11}
              width={38}
              height={22}
              rx={11}
              strokeWidth={1}
              className="fill-surface-raised stroke-border"
            />
            <text
              x={mx}
              y={my + 4.5}
              textAnchor="middle"
              fontSize={12}
              fontWeight={600}
              className="fill-text font-body"
            >
              ×{signed(input.weight)}
            </text>
          </g>
        );
      })}
      <circle
        cx={NEURON.x}
        cy={NEURON.y}
        r={NEURON.r}
        strokeWidth={2}
        className="fill-amber-subtle stroke-amber"
      />
      <text
        x={NEURON.x}
        y={NEURON.y - 10}
        textAnchor="middle"
        fontSize={11}
        className="fill-text-muted font-body"
      >
        Total
      </text>
      <text
        x={NEURON.x}
        y={NEURON.y + 16}
        textAnchor="middle"
        fontSize={22}
        fontWeight={700}
        className="fill-text font-display"
      >
        {total}
      </text>
      <text
        x={NEURON.x}
        y={NEURON.y + NEURON.r + 20}
        textAnchor="middle"
        fontSize={12}
        className="fill-text-muted font-body"
      >
        Bias {signed(CHAI_NEURON.bias)}
      </text>
      <line
        x1={NEURON.x + NEURON.r}
        y1={NEURON.y}
        x2={NEURON.x + NEURON.r + 26}
        y2={NEURON.y}
        strokeWidth={1.5}
        markerEnd="url(#neuron-arrow)"
        className="stroke-text-muted"
      />
      <text
        x={366}
        y={NEURON.y + 2}
        textAnchor="middle"
        fontSize={18}
        fontWeight={700}
        className="fill-text font-display"
      >
        {answer}
      </text>
      <text
        x={366}
        y={NEURON.y + 20}
        textAnchor="middle"
        fontSize={11}
        className="fill-text-muted font-body"
      >
        above 0
      </text>
    </svg>
  );
}

/** The figure as text, for the Markdown copy of the lesson (llms-full.txt). */
export const neuronMarkdown = [
  "A neuron deciding whether to buy chai:",
  "",
  ...CHAI_NEURON.inputs.map(
    (input, i) =>
      `- ${input.label}: ${CHAI_EXAMPLE[i] ? "yes" : "no"} (${CHAI_EXAMPLE[i]}), weight ${signed(input.weight)}`,
  ),
  `- Bias: ${signed(CHAI_NEURON.bias)}`,
  `- Total: ${total}, which is above 0, so the answer is ${answer.toLowerCase()}`,
].join("\n");
