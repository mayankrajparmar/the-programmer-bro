import { highlight, type CodeLanguage } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

/**
 * The design system's CodeBlock: highlighted code with its language (or a
 * filename) and a Copy button. Highlighting happens at build time. Long lines
 * scroll sideways; code never wraps.
 */
export async function CodeBlock({
  code,
  lang = "text",
  filename,
  className,
}: {
  code: string;
  lang?: CodeLanguage;
  filename?: string;
  className?: string;
}) {
  const html = await highlight(code, lang);

  return (
    <figure
      className={cn(
        "tpb-code m-0 overflow-hidden rounded-md border border-border bg-surface-code text-text",
        className,
      )}
    >
      <figcaption className="flex items-center justify-between border-b border-border py-1 pr-1 pl-4">
        <span className="font-mono text-code-small text-text-muted">{filename ?? lang}</span>
        <CopyButton text={code} />
      </figcaption>
      {/* Shiki's output: our own content, highlighted at build time. */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}

/** Code inside a sentence. Never put a link inside it. */
export function InlineCode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "rounded-sm border border-border bg-surface-code px-1.5 py-px font-mono text-[0.875em] text-text",
        className,
      )}
    >
      {children}
    </code>
  );
}
