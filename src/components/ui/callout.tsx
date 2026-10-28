import { Info, Lightbulb, Link2, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * The design system's Callout: pulls one point out of lesson prose (at most one
 * per section). Body text stays `text`; only the icon and title take the kind's
 * colour. An <aside>, so screen readers treat it as supporting content.
 */

export type CalloutKind = "note" | "tip" | "warn" | "analogy";

const KINDS: Record<CalloutKind, { title: string; icon: LucideIcon; box: string; accent: string }> =
  {
    note: { title: "Note", icon: Info, box: "bg-info-subtle", accent: "text-info" },
    tip: { title: "Tip", icon: Lightbulb, box: "bg-success-subtle", accent: "text-success" },
    warn: {
      title: "Watch out",
      icon: TriangleAlert,
      box: "bg-danger-subtle",
      accent: "text-danger",
    },
    analogy: {
      title: "Think of it like this",
      icon: Link2,
      box: "bg-amber-subtle",
      accent: "text-accent-text",
    },
  };

export function Callout({
  kind = "note",
  title,
  className,
  children,
}: {
  kind?: CalloutKind;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { title: defaultTitle, icon: Icon, box, accent } = KINDS[kind];

  return (
    <aside
      className={cn(
        "grid grid-cols-[20px_1fr] gap-x-3 gap-y-1 rounded-md p-4 text-text",
        box,
        className,
      )}
    >
      <Icon aria-hidden className={cn("size-5 self-center", accent)} />
      <p
        className={cn(
          "m-0 self-center font-display text-[14px]/[20px] font-bold tracking-[0.01em]",
          accent,
        )}
      >
        {title ?? defaultTitle}
      </p>
      <div className="col-start-2 text-body [&>p]:m-0 [&>p+p]:mt-2">{children}</div>
    </aside>
  );
}
