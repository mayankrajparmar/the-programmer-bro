import type { MDXComponents } from "mdx/types";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { Callout, type CalloutKind } from "@/components/ui/callout";
import { CodeBlock, InlineCode } from "@/components/ui/code-block";
import { isCodeLanguage } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { AiLayersDiagram } from "../diagrams/ai-layers";
import { AiTimelineDiagram } from "../diagrams/ai-timeline";
import { LlmSizesDiagram } from "../diagrams/llm-sizes";
import { NextTokenDiagram } from "../diagrams/next-token";
import { HindiTokensDiagram, TokenIdsDiagram } from "../diagrams/tokens";

/*
 * What lesson MDX can use, following the lesson template (hook, concept,
 * analogy, example, try it, key takeaways). Plain Markdown maps to styled
 * elements; spacing between blocks comes from .tpb-prose in globals.css.
 *
 *   <Analogy>…</Analogy>               "Think of it like this"
 *   <TryIt>…</TryIt>                   something to do now
 *   <Callout kind="note|tip|warn">     a fact, a tip or "Watch out"
 *   <Figure caption="…">…</Figure>     a diagram with its caption
 *   <KeyTakeaways>- …</KeyTakeaways>   the bullet summary at the end
 */

function Analogy({ children }: { children: ReactNode }) {
  return <Callout kind="analogy">{children}</Callout>;
}

function TryIt({ children }: { children: ReactNode }) {
  return (
    <Callout kind="tip" title="Try it">
      {children}
    </Callout>
  );
}

function LessonCallout({
  kind = "note",
  title,
  children,
}: {
  kind?: Exclude<CalloutKind, "analogy">;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Callout kind={kind} title={title}>
      {children}
    </Callout>
  );
}

function Figure({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="m-0 rounded-lg border border-border bg-surface p-4 sm:p-6">
      {children}
      <figcaption className="mt-4 text-caption text-text-muted">{caption}</figcaption>
    </figure>
  );
}

function KeyTakeaways({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="key-takeaways"
      className="tpb-takeaways rounded-lg bg-amber-subtle p-4 sm:p-6"
    >
      <h2 id="key-takeaways" className="m-0 mb-3 font-display text-title">
        Key takeaways
      </h2>
      {children}
    </section>
  );
}

/** Fenced code becomes a CodeBlock: ```python … ``` */
function Pre({ children }: { children?: ReactNode }) {
  const code = isValidElement(children)
    ? (children as ReactElement<{ className?: string; children?: ReactNode }>)
    : null;
  const lang = code?.props.className?.replace(/^language-/, "") ?? "text";
  const text = typeof code?.props.children === "string" ? code.props.children : "";
  return <CodeBlock code={text} lang={isCodeLanguage(lang) ? lang : "text"} />;
}

function Anchor({ href = "", children }: { href?: string; children?: ReactNode }) {
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className="text-accent-text underline underline-offset-[3px] hover:text-text"
    >
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

export const lessonComponents: MDXComponents = {
  h2: ({ id, children }) => (
    <h2 id={id} className="scroll-mt-6 font-display text-h2">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="font-display text-h3">{children}</h3>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: Anchor,
  code: ({ children }) => <InlineCode>{children}</InlineCode>,
  pre: Pre,
  table: ({ children }) => (
    <div className="tpb-table overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-left text-small sm:text-body">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border bg-surface px-4 py-3 align-bottom font-display text-label">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-border px-4 py-3 align-top">{children}</td>,
  ul: ({ children, className }) => <ul className={cn("tpb-list", className)}>{children}</ul>,
  ol: ({ children }) => <ol className="tpb-list list-decimal">{children}</ol>,
  Analogy,
  TryIt,
  Callout: LessonCallout,
  Figure,
  KeyTakeaways,
  AiLayersDiagram,
  AiTimelineDiagram,
  LlmSizesDiagram,
  NextTokenDiagram,
  TokenIdsDiagram,
  HindiTokensDiagram,
};
