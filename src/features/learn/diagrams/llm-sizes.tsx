/*
 * Lesson 3, figure 1: parameters in three LLMs whose makers published their
 * size, as horizontal bars on one linear scale (so GPT-2's bar is a sliver,
 * which is the point). A list rather than an SVG: every value is printed as
 * text, so the figure reads the same to screen readers. One series, one colour.
 */

interface Model {
  name: string;
  maker: string;
  year: number;
  /** Parameters, in billions. */
  billions: number;
}

const MODELS: readonly Model[] = [
  { name: "GPT-2", maker: "OpenAI", year: 2019, billions: 1.5 },
  { name: "GPT-3", maker: "OpenAI", year: 2020, billions: 175 },
  { name: "Llama 3.1", maker: "Meta", year: 2024, billions: 405 },
];

const LARGEST = Math.max(...MODELS.map((model) => model.billions));

export function LlmSizesDiagram() {
  return (
    <ol aria-label="Parameters in three LLMs" className="m-0 grid list-none gap-5 p-0">
      {MODELS.map((model) => (
        <li key={model.name} className="grid gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span>
              <span className="font-display text-label">{model.name}</span>{" "}
              <span className="text-small text-text-muted">
                {model.maker}, {model.year}
              </span>
            </span>
            <span className="text-small">{model.billions} billion</span>
          </div>
          <div aria-hidden className="h-3 border-l border-border-strong">
            <div
              className="h-full min-w-[3px] rounded-r-sm bg-amber"
              style={{ width: `${(model.billions / LARGEST) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
