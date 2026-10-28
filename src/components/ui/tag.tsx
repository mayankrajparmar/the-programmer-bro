import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * The design system's Tag: labels news topics and lesson levels. Tags are read,
 * not clicked (for filters use a pill-shaped secondary button). The word always
 * carries the meaning; colour only helps scanning.
 */
export const tagVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-display text-[12px]/[18px] font-semibold tracking-[0.02em] whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface-raised text-text-muted",
        models: "border-transparent bg-amber-subtle text-accent-text",
        tools: "border-border bg-surface-raised text-text",
        research: "border-transparent bg-info-subtle text-info",
        policy: "border-border bg-surface-raised text-text",
        india: "border-transparent bg-success-subtle text-success",
        level: "border-border-strong bg-transparent text-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type TagTone = NonNullable<VariantProps<typeof tagVariants>["tone"]>;

export function Tag({
  tone,
  className,
  children,
}: {
  tone?: TagTone;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn(tagVariants({ tone }), className)}>{children}</span>;
}
