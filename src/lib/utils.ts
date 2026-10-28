import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * tailwind-merge has to know the design system's type-style names, or it reads
 * `text-h1` as a colour and drops it when `text-text-muted` comes later.
 * Keep these lists in step with design/tokens.json (a unit test checks).
 */
export const TYPE_STYLES = [
  "display",
  "h1",
  "h2",
  "h3",
  "title",
  "label",
  "lesson",
  "body",
  "body-strong",
  "small",
  "caption",
  "code",
  "code-small",
] as const;

export const RADII = ["sm", "md", "lg", "pill"] as const;

const twMerge = extendTailwindMerge({
  override: {
    theme: {
      text: [...TYPE_STYLES],
      radius: [...RADII],
    },
  },
});

/** Joins class names and lets later Tailwind classes override earlier ones (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
