import NETWORK from "./digit-network.json";

/*
 * Lesson 9, figures 2 and 3: the tiny network we trained to read handwritten digits
 * (scripts/lessons/digit-network.py writes digit-network.json). Figure 2 draws the
 * network reading one test image, a 3. Figure 3 lists its ten outputs for that image
 * before and after training, as bars on one 0-100% scale. One colour throughout; every
 * value is printed as text.
 */

export { NETWORK as DIGIT_NETWORK };

const DIGITS = Array.from({ length: NETWORK.outputs }, (_, digit) => digit);
const AFTER = NETWORK.example.after;
const BEFORE = NETWORK.example.before;
const topGuess = (percents: readonly number[]) => percents.indexOf(Math.max(...percents));
const verdict = (percents: readonly number[]) =>
  topGuess(percents) === NETWORK.example.digit ? "right" : "wrong";

/** How the lesson writes an output: one decimal place, and "under 0.1%" for tiny ones. */
export const outputPercent = (percent: number) =>
  percent < 0.05 ? "under 0.1%" : `${percent.toFixed(1)}%`;

const WIDTH = 400;
const HEIGHT = 292;
const CELL = 11;
const GRID = { x: 10, y: 120 };
const HIDDEN = { x: 200, top: 52, gap: 15, r: 5 };
const OUTPUT = { x: 322, top: 60, gap: 24, r: 8 };

const hiddenY = (i: number) => HIDDEN.top + i * HIDDEN.gap;
const outputY = (digit: number) => OUTPUT.top + digit * OUTPUT.gap;
const ROWS = NETWORK.example.pixels.length;

const LABEL = `A neural network reading a handwritten ${NETWORK.example.digit}, drawn as an 8 by 8 grid of pixels. All ${NETWORK.inputs} pixels connect to each of ${NETWORK.hidden} neurons in a hidden layer, and every hidden neuron connects to each of ${NETWORK.outputs} outputs, one per digit. After training, the output for ${topGuess(AFTER)} is ${outputPercent(AFTER[topGuess(AFTER)] ?? 0)}.`;

function ColumnTitle({ x, title, detail }: { x: number; title: string; detail: string }) {
  return (
    <g>
      <text
        x={x}
        y={16}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        className="fill-text font-display"
      >
        {title}
      </text>
      <text x={x} y={31} textAnchor="middle" fontSize={11} className="fill-text-muted font-body">
        {detail}
      </text>
    </g>
  );
}

export function DigitNetworkDiagram() {
  const winner = topGuess(AFTER);
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label={LABEL}
      className="mx-auto block h-auto max-w-[560px]"
    >
      <ColumnTitle x={GRID.x + (ROWS * CELL) / 2} title="Input" detail="64 pixels" />
      <ColumnTitle x={HIDDEN.x} title="Hidden layer" detail="16 neurons" />
      <ColumnTitle x={OUTPUT.x + 10} title="Output" detail="10 digits" />

      {/* Connections: every row of pixels to every hidden neuron, every hidden neuron to every output. */}
      <g strokeWidth={0.6} className="stroke-border" opacity={0.8}>
        {NETWORK.example.pixels.map((_, row) =>
          Array.from({ length: NETWORK.hidden }, (_, h) => (
            <line
              key={`in-${row}-${h}`}
              x1={GRID.x + ROWS * CELL}
              y1={GRID.y + row * CELL + CELL / 2}
              x2={HIDDEN.x - HIDDEN.r}
              y2={hiddenY(h)}
            />
          )),
        )}
        {Array.from({ length: NETWORK.hidden }, (_, h) =>
          DIGITS.map((digit) => (
            <line
              key={`out-${h}-${digit}`}
              x1={HIDDEN.x + HIDDEN.r}
              y1={hiddenY(h)}
              x2={OUTPUT.x - OUTPUT.r}
              y2={outputY(digit)}
            />
          )),
        )}
      </g>

      <rect
        x={GRID.x - 1}
        y={GRID.y - 1}
        width={ROWS * CELL + 2}
        height={ROWS * CELL + 2}
        strokeWidth={1}
        className="fill-bg stroke-border-strong"
      />
      {NETWORK.example.pixels.map((pixels, row) =>
        pixels.map((value, column) => (
          <rect
            key={`${row}-${column}`}
            x={GRID.x + column * CELL}
            y={GRID.y + row * CELL}
            width={CELL}
            height={CELL}
            fillOpacity={value / 16}
            className="fill-text"
          />
        )),
      )}

      {Array.from({ length: NETWORK.hidden }, (_, h) => (
        <circle
          key={h}
          cx={HIDDEN.x}
          cy={hiddenY(h)}
          r={HIDDEN.r}
          strokeWidth={1.5}
          className="fill-surface-raised stroke-border-strong"
        />
      ))}

      {DIGITS.map((digit) => {
        const top = digit === winner;
        return (
          <g key={digit}>
            <circle
              cx={OUTPUT.x}
              cy={outputY(digit)}
              r={OUTPUT.r}
              strokeWidth={1.5}
              className={
                top ? "fill-amber stroke-amber" : "fill-surface-raised stroke-border-strong"
              }
            />
            <text
              x={OUTPUT.x + 14}
              y={outputY(digit) + 4.5}
              fontSize={13}
              fontWeight={top ? 700 : 400}
              className={top ? "fill-text font-body" : "fill-text-muted font-body"}
            >
              {top ? `${digit}: ${outputPercent(AFTER[digit] ?? 0)}` : digit}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Outputs({
  title,
  label,
  percents,
}: {
  title: string;
  label: string;
  percents: readonly number[];
}) {
  const top = topGuess(percents);
  return (
    <section
      aria-label={label}
      className="grid content-start gap-3 rounded-md border border-border bg-surface-raised p-4"
    >
      <h3 className="m-0 font-display text-label">{title}</h3>
      <ol className="m-0 grid list-none gap-1.5 p-0">
        {DIGITS.map((digit) => (
          <li key={digit} className="grid grid-cols-[1.25rem_1fr_6.5rem] items-center gap-2">
            <span className="font-display text-label">{digit}</span>
            <span aria-hidden className="h-2.5 border-l border-border-strong">
              <span
                className="block h-full rounded-r-sm bg-amber"
                style={{ width: `${percents[digit] ?? 0}%` }}
              />
            </span>
            <span className="text-right text-small">
              {outputPercent(percents[digit] ?? 0)}
              {digit === top && <span className="sr-only"> (top guess)</span>}
            </span>
          </li>
        ))}
      </ol>
      <p className="m-0 border-t border-border pt-3 text-small">
        <strong className="font-semibold">Top guess:</strong> {top} ({verdict(percents)})
      </p>
    </section>
  );
}

/** Figure 3: the ten outputs for the example image, before and after training. */
export function DigitGuessesDiagram() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Outputs
        title="Before training"
        label={`Outputs for the handwritten ${NETWORK.example.digit} before training`}
        percents={BEFORE}
      />
      <Outputs
        title={`After ${NETWORK.passes} passes`}
        label={`Outputs for the handwritten ${NETWORK.example.digit} after training`}
        percents={AFTER}
      />
    </div>
  );
}

const outputList = (percents: readonly number[]) =>
  DIGITS.map((digit) => `${digit}: ${outputPercent(percents[digit] ?? 0)}`).join(", ");

/** Figure 2 as text, for the Markdown copy of the lesson (llms-full.txt). */
export const digitNetworkMarkdown = [
  `A neural network reading a handwritten ${NETWORK.example.digit}:`,
  "",
  `- Input layer: the ${NETWORK.inputs} pixels of an 8 × 8 image`,
  `- Hidden layer: ${NETWORK.hidden} neurons, each connected to every pixel`,
  `- Output layer: ${NETWORK.outputs} outputs, one per digit, each connected to every hidden neuron`,
  `- After training, the output for ${topGuess(AFTER)} is ${outputPercent(AFTER[topGuess(AFTER)] ?? 0)}`,
].join("\n");

/** Figure 3 as text. */
export const digitGuessesMarkdown = [
  `The network's outputs for the handwritten ${NETWORK.example.digit}:`,
  "",
  `- Before training: ${outputList(BEFORE)}. Top guess: ${topGuess(BEFORE)} (${verdict(BEFORE)}).`,
  `- After ${NETWORK.passes} passes: ${outputList(AFTER)}. Top guess: ${topGuess(AFTER)} (${verdict(AFTER)}).`,
].join("\n");
