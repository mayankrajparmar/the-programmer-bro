import { adsEnabled } from "@/config/ads";
import { cn } from "@/lib/utils";

/**
 * The design system's AdSlot: reserves a fixed 280px place for an ad so turning
 * ads on never shifts the page. Place between lesson sections, or after the
 * third card in News and Resources; never inside a quiz, code block or
 * playground, and never above the first screen of a lesson.
 */
export function AdSlot({ className }: { className?: string }) {
  if (!adsEnabled) return null;

  return (
    <div className={cn("mx-auto my-8 grid max-w-lesson gap-1", className)}>
      <span className="text-caption text-text-muted">Advertisement</span>
      <div className="grid h-[var(--ad-slot-inline)] place-items-center rounded-md border border-dashed border-border-strong bg-surface text-small text-text-muted" />
    </div>
  );
}
