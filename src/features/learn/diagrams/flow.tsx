import { ArrowDown } from "lucide-react";

/*
 * A top-to-bottom flow of numbered stages with arrows between them, used by figures that
 * follow something through a process (lesson 10's journey of a prompt, lesson 12's
 * training stages). An ordered list, so screen readers read the stages in order; a
 * highlighted stage gets an amber border, and every word is text.
 */

export interface FlowStage {
  name: string;
  detail: string;
  /** Shown after the name, such as "× 12". */
  badge?: string;
  /** Smaller parts inside the stage. */
  parts?: readonly { name: string; detail: string }[];
  /** What comes out of this stage. */
  result?: string;
  highlight?: boolean;
}

export function Flow({ label, stages }: { label: string; stages: readonly FlowStage[] }) {
  return (
    <ol aria-label={label} className="m-0 grid list-none gap-2 p-0">
      {stages.map((stage, index) => (
        <li key={stage.name} className="grid gap-2">
          {index > 0 && (
            <ArrowDown aria-hidden className="mx-auto size-5 text-text-muted" strokeWidth={1.75} />
          )}
          <div
            className={
              stage.highlight
                ? "grid gap-2 rounded-md border border-amber bg-amber-subtle p-4"
                : "grid gap-1 rounded-md border border-border bg-surface-raised p-4"
            }
          >
            <h3 className="m-0 flex flex-wrap items-baseline gap-x-2 font-display text-label">
              <span>
                {index + 1}. {stage.name}
              </span>
              {stage.badge && (
                <span className="font-body text-small text-text-muted">{stage.badge}</span>
              )}
            </h3>
            <p className="m-0 text-small">{stage.detail}</p>
            {stage.parts && (
              <ul className="m-0 grid list-none gap-2 p-0">
                {stage.parts.map((part) => (
                  <li
                    key={part.name}
                    className="rounded-sm border border-border bg-surface-raised px-3 py-2 text-small"
                  >
                    <strong className="font-semibold">{part.name}:</strong> {part.detail}
                  </li>
                ))}
              </ul>
            )}
            {stage.result && (
              <p className="m-0 text-small">
                <strong className="font-semibold">You get:</strong> {stage.result}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** A flow as text, for the Markdown copy of a lesson (llms-full.txt). */
export function flowMarkdown(stages: readonly FlowStage[]): string {
  return stages
    .map((stage, index) =>
      [
        `${index + 1}. ${stage.name}: ${stage.detail}`,
        ...(stage.parts ?? []).map((part) => `   - ${part.name}: ${part.detail}`),
        ...(stage.result ? [`   You get: ${stage.result}`] : []),
      ].join("\n"),
    )
    .join("\n");
}
