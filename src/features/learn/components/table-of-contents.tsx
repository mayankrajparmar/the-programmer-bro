"use client";

import { ChevronDown, ListOrdered } from "lucide-react";
import { useEffect, useState } from "react";
import type { Heading } from "@/lib/mdx";
import { cn } from "@/lib/utils";

/** The id of the section currently being read: the last heading above the top third of the screen. */
function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const update = () => {
      const line = window.innerHeight / 3;
      let current = elements[0]?.id ?? null;
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= line) current = element.id;
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return active;
}

/** "On this page", beside the lesson on wide screens; the current section is marked. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const active = useActiveHeading(headings.map((heading) => heading.id));

  return (
    <nav aria-labelledby="toc-title">
      <h2 id="toc-title" className="m-0 mb-2 font-display text-label text-text-muted">
        On this page
      </h2>
      <ol className="m-0 list-none border-l border-border p-0">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={heading.id === active ? "true" : undefined}
              className={cn(
                "-ml-px flex min-h-11 items-center border-l-2 border-transparent px-4 py-2 text-small text-text-muted no-underline",
                "transition-colors duration-[180ms] ease-tpb hover:text-text",
                "aria-[current=true]:border-amber aria-[current=true]:text-text",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The same list folded into a disclosure, for narrower screens. */
export function MobileTableOfContents({ headings }: { headings: Heading[] }) {
  return (
    <details className="group rounded-md border border-border-strong bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-md px-4 font-display text-label [&::-webkit-details-marker]:hidden">
        <ListOrdered aria-hidden className="size-5 flex-none text-text-muted" />
        <span className="flex-auto">On this page</span>
        <ChevronDown
          aria-hidden
          className="size-4 flex-none transition-transform duration-200 ease-tpb group-open:rotate-180"
        />
      </summary>
      <ol className="tpb-sheet m-0 list-none px-2 pt-0 pb-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="flex min-h-11 items-center rounded-sm py-2 pr-2 pl-9 text-small text-text no-underline hover:bg-surface-raised hover:text-text"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
