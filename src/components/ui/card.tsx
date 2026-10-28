import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * The design system's card, shared by news and resource cards: meta line,
 * title, body, and a footer with one link. With `interactive`, the whole card
 * lifts on hover and the CardLink marked `stretch` makes the whole card clickable.
 */

export function Card({
  as: Element = "article",
  interactive = false,
  className,
  children,
}: {
  as?: "article" | "div" | "li";
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Element
      className={cn(
        "grid gap-2 rounded-lg border border-border bg-surface p-4 sm:p-6",
        interactive &&
          "relative transition-[border-color,transform] duration-200 ease-tpb hover:-translate-y-[3px] hover:border-border-strong",
        className,
      )}
    >
      {children}
    </Element>
  );
}

export function CardMeta({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-text-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardType({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-[12px]/[18px] font-bold tracking-[0.06em] text-text-muted uppercase">
      {children}
    </span>
  );
}

export function CardTitle({
  as: Heading = "h3",
  className,
  children,
}: {
  as?: "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Heading className={cn("m-0 font-display text-title text-text", className)}>{children}</Heading>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("m-0 text-text", className)}>{children}</p>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-2 flex items-center justify-between gap-3 text-small text-text-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** An outbound link that opens in a new tab. `stretch` makes the whole interactive card its target. */
export function CardLink({
  href,
  label,
  stretch = false,
  className,
  children,
}: {
  href: string;
  /** Accessible name when the visible text alone is ambiguous, e.g. "Read source: <headline>". */
  label?: string;
  stretch?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={label ? `${label} (opens in a new tab)` : undefined}
      className={cn(
        "group/link inline-flex min-h-11 items-center gap-1 font-display text-label text-accent-text no-underline hover:text-accent-text hover:underline",
        stretch && "after:absolute after:inset-0 after:rounded-lg",
        className,
      )}
    >
      {children}
      {!label && <span className="sr-only">(opens in a new tab)</span>}
      <ExternalLink
        aria-hidden
        className="size-4 transition-transform duration-200 ease-tpb group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
      />
    </a>
  );
}
