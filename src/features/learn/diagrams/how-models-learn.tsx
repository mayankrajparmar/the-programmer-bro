import LEARN from "./how-models-learn.json";

/*
 * Lesson 11's figures, from scripts/lessons/how-models-learn.py (how-models-learn.json).
 * Figure 1: the samosa example's loss for every guessed price, a valley at the right
 * answer, with the first steps of gradient descent on it. Figure 2: the real handwriting
 * network's loss on its test images after each pass. One series each, in amber; text in
 * text tokens; every value is in the aria-label and the Markdown version.
 */

export { LEARN };

const rupees = (value: number) => `₹${value.toFixed(2)}`;
const RIGHT = LEARN.samosa.runs["about right"];

/** The samosa example's loss: the average squared error of bill = price × samosas. */
export function samosaLoss(price: number): number {
  const errors = LEARN.samosa.receipts.map(([count = 0, bill = 0]) => (price * count - bill) ** 2);
  return errors.reduce((sum, error) => sum + error, 0) / errors.length;
}

// Figure 1's plot area: price 0 to 30 rupees across, loss 0 to 2,200 up.
const HILL = { width: 360, height: 280, left: 52, right: 340, top: 24, bottom: 216 };
const MAX_PRICE = 30;
const MAX_LOSS = 2200;
const hx = (price: number) => HILL.left + (price / MAX_PRICE) * (HILL.right - HILL.left);
const hy = (loss: number) => HILL.bottom - (loss / MAX_LOSS) * (HILL.bottom - HILL.top);
const CURVE = Array.from({ length: 61 }, (_, i) => i / 2)
  .map(
    (price, i) =>
      `${i === 0 ? "M" : "L"}${hx(price).toFixed(1)},${hy(samosaLoss(price)).toFixed(1)}`,
  )
  .join(" ");
const SHOWN_STEPS = 3;

const HILL_LABEL = `A U-shaped curve of the loss for every guessed price of a samosa, from ₹0 to ₹30. It is lowest, at 0, for the right price, ₹15. Gradient descent starts at ${rupees(RIGHT.prices[0] ?? 0)}, where the loss is ${RIGHT.losses[0]}, then steps to ${RIGHT.prices
  .slice(1, SHOWN_STEPS + 1)
  .map(rupees)
  .join(", then ")}, each step lower down the curve.`;

export function SamosaHillDiagram() {
  const steps = RIGHT.prices.slice(0, SHOWN_STEPS + 1);
  return (
    <svg
      viewBox={`0 0 ${HILL.width} ${HILL.height}`}
      width="100%"
      role="img"
      aria-label={HILL_LABEL}
      className="mx-auto block h-auto max-w-[560px]"
    >
      <defs>
        <marker
          id="hill-arrow"
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
      {[0, 1000, 2000].map((loss) => (
        <g key={loss}>
          <line
            x1={HILL.left}
            x2={HILL.right}
            y1={hy(loss)}
            y2={hy(loss)}
            strokeWidth={1}
            className="stroke-border"
          />
          <text
            x={HILL.left - 6}
            y={hy(loss) + 4}
            textAnchor="end"
            fontSize={11}
            className="fill-text-muted font-body"
          >
            {loss.toLocaleString("en-US")}
          </text>
        </g>
      ))}
      {[0, 5, 10, 15, 20, 25, 30].map((price) => (
        <text
          key={price}
          x={hx(price)}
          y={HILL.bottom + 16}
          textAnchor="middle"
          fontSize={11}
          className="fill-text-muted font-body"
        >
          ₹{price}
        </text>
      ))}
      <text
        x={(HILL.left + HILL.right) / 2}
        y={HILL.height - 6}
        textAnchor="middle"
        fontSize={12}
        className="fill-text font-body"
      >
        Guessed price of one samosa
      </text>
      <text
        x={hx(15)}
        y={HILL.bottom + 29}
        textAnchor="middle"
        fontSize={10}
        className="fill-text-muted font-body"
      >
        lowest loss
      </text>
      <text x={HILL.left} y={14} fontSize={12} className="fill-text font-body">
        Loss
      </text>

      <path d={CURVE} fill="none" strokeWidth={2} className="stroke-text-muted" />

      {steps.slice(1).map((price, i) => (
        <line
          key={i}
          x1={hx(steps[i] ?? 0)}
          y1={hy(samosaLoss(steps[i] ?? 0))}
          x2={hx(price)}
          y2={hy(samosaLoss(price)) - 6}
          strokeWidth={1.5}
          markerEnd="url(#hill-arrow)"
          className="stroke-text-muted"
          strokeDasharray="4 3"
        />
      ))}
      {steps.map((price, i) => (
        <circle
          key={i}
          cx={hx(price)}
          cy={hy(samosaLoss(price))}
          r={5}
          strokeWidth={2}
          className="fill-amber stroke-surface-raised"
        />
      ))}
      <text
        x={hx(steps[0] ?? 0) + 10}
        y={hy(samosaLoss(steps[0] ?? 0)) - 6}
        fontSize={12}
        className="fill-text font-body"
      >
        Start: {rupees(steps[0] ?? 0)}
      </text>
      {/* Labels sit inside the valley, clear of the curve and the arrows. */}
      <line
        x1={hx(15.6)}
        y1={hy(640)}
        x2={hx(steps[1] ?? 0) + 2}
        y2={hy(samosaLoss(steps[1] ?? 0)) - 6}
        strokeWidth={1}
        className="stroke-text-muted"
      />
      <text
        x={hx(16)}
        y={hy(700)}
        textAnchor="middle"
        fontSize={12}
        className="fill-text font-body"
      >
        Step 1: {rupees(steps[1] ?? 0)}
      </text>
    </svg>
  );
}

// Figure 2's plot area: passes 0 to 20 across, loss 0 to 3 up.
const CURVE_BOX = { width: 360, height: 250, left: 40, right: 340, top: 20, bottom: 200 };
const LOSSES = LEARN.network.testLoss;
const PASSES = LOSSES.length - 1;
const GUESSING = Math.log(10);
const cx = (pass: number) => CURVE_BOX.left + (pass / PASSES) * (CURVE_BOX.right - CURVE_BOX.left);
const cy = (loss: number) => CURVE_BOX.bottom - (loss / 3) * (CURVE_BOX.bottom - CURVE_BOX.top);
const first = LOSSES[0] ?? 0;
const last = LOSSES.at(-1) ?? 0;

const LOSS_LABEL = `A line falling steeply, then levelling off: the handwriting network's loss on its ${LEARN.network.testImages} test images, from ${first.toFixed(2)} before training to ${last.toFixed(2)} after ${PASSES} passes. A dashed line at ${GUESSING.toFixed(2)} marks the loss of guessing every digit evenly.`;

export function LossCurveDiagram() {
  return (
    <svg
      viewBox={`0 0 ${CURVE_BOX.width} ${CURVE_BOX.height}`}
      width="100%"
      role="img"
      aria-label={LOSS_LABEL}
      className="mx-auto block h-auto max-w-[560px]"
    >
      {[0, 1, 2, 3].map((loss) => (
        <g key={loss}>
          <line
            x1={CURVE_BOX.left}
            x2={CURVE_BOX.right}
            y1={cy(loss)}
            y2={cy(loss)}
            strokeWidth={1}
            className="stroke-border"
          />
          <text
            x={CURVE_BOX.left - 6}
            y={cy(loss) + 4}
            textAnchor="end"
            fontSize={11}
            className="fill-text-muted font-body"
          >
            {loss}
          </text>
        </g>
      ))}
      {[0, 5, 10, 15, 20].map((pass) => (
        <text
          key={pass}
          x={cx(pass)}
          y={CURVE_BOX.bottom + 16}
          textAnchor="middle"
          fontSize={11}
          className="fill-text-muted font-body"
        >
          {pass}
        </text>
      ))}
      <text
        x={(CURVE_BOX.left + CURVE_BOX.right) / 2}
        y={CURVE_BOX.height - 6}
        textAnchor="middle"
        fontSize={12}
        className="fill-text font-body"
      >
        Passes through the training images
      </text>
      <text x={CURVE_BOX.left} y={12} fontSize={12} className="fill-text font-body">
        Loss on test images
      </text>

      <line
        x1={CURVE_BOX.left}
        x2={CURVE_BOX.right}
        y1={cy(GUESSING)}
        y2={cy(GUESSING)}
        strokeWidth={1.5}
        strokeDasharray="5 4"
        className="stroke-text-muted"
      />
      <text
        x={CURVE_BOX.right}
        y={cy(GUESSING) - 6}
        textAnchor="end"
        fontSize={11}
        className="fill-text-muted font-body"
      >
        Guessing evenly: {GUESSING.toFixed(2)}
      </text>

      <polyline
        points={LOSSES.map((loss, pass) => `${cx(pass)},${cy(loss)}`).join(" ")}
        fill="none"
        strokeWidth={2}
        strokeLinejoin="round"
        className="stroke-amber"
      />
      {LOSSES.map((loss, pass) => (
        <circle
          key={pass}
          cx={cx(pass)}
          cy={cy(loss)}
          r={4}
          strokeWidth={1.5}
          className="fill-amber stroke-surface-raised"
        />
      ))}
      <text x={cx(0) + 10} y={cy(first) - 4} fontSize={12} className="fill-text font-body">
        {first.toFixed(2)} before training
      </text>
      <text
        x={cx(PASSES)}
        y={cy(last) - 12}
        textAnchor="end"
        fontSize={12}
        className="fill-text font-body"
      >
        {last.toFixed(2)} after {PASSES} passes
      </text>
    </svg>
  );
}

/** Figure 1 as text, for the Markdown copy of the lesson (llms-full.txt). */
export const samosaHillMarkdown = [
  "The loss for every guessed price of a samosa makes a U-shaped curve, lowest (0) at the right price, ₹15. Gradient descent with a learning rate of 0.04:",
  "",
  ...RIGHT.prices
    .slice(0, SHOWN_STEPS + 1)
    .map(
      (price, i) =>
        `- ${i === 0 ? "Start" : `Step ${i}`}: ${rupees(price)} (loss ${RIGHT.losses[i]})`,
    ),
].join("\n");

/** Figure 2 as text. */
export const lossCurveMarkdown = [
  `The handwriting network's loss on its ${LEARN.network.testImages} test images, before training and after each pass (guessing every digit evenly would score ${GUESSING.toFixed(2)}):`,
  "",
  LOSSES.map((loss, pass) => `${pass}: ${loss.toFixed(2)}`).join(", "),
].join("\n");
