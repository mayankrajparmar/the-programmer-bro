import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/*
 * Form controls: a text input, a text area and a select that share one look, each
 * with a visible label above it. Used by the admin pages.
 */

const control =
  "w-full min-h-11 rounded-md border border-border-strong bg-bg px-3 py-2 font-body text-body text-text placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "cursor-pointer", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="font-display text-label text-text">
        {label}
      </label>
      {children}
      {hint && <p className="m-0 text-small text-text-muted">{hint}</p>}
    </div>
  );
}
