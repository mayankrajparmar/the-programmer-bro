import { cn } from "@/lib/utils";

/** An amber progress bar on a pill track, with an accessible value. */
export function ProgressBar({
  label,
  value,
  max,
  valueText,
  size = "md",
  className,
}: {
  label: string;
  value: number;
  max: number;
  valueText: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className={cn(
        "overflow-hidden rounded-pill bg-border",
        size === "md" ? "h-2" : "h-1.5",
        className,
      )}
    >
      <div
        className="h-full rounded-pill bg-amber transition-[width] duration-500 ease-tpb"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
