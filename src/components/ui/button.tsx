import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/*
 * The design system's Button (tpb-btn). Use `buttonVariants()` to style a link
 * (`<a>` or next/link) as a button, and `<Button>` for real buttons.
 * Each variant sets its own border colour, so classes never conflict.
 */
const buttonStyles = cva(
  [
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border",
    "font-display text-label no-underline",
    "transition-[background-color,border-color,color,transform] duration-[180ms] ease-tpb",
    "active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50",
    "[&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-tpb",
  ],
  {
    variants: {
      variant: {
        primary:
          "border-amber bg-amber text-on-amber hover:-translate-y-px hover:border-amber-hover hover:bg-amber-hover hover:text-on-amber",
        secondary:
          "border-border-strong bg-transparent text-text hover:border-text-muted hover:bg-surface-raised hover:text-text",
        ghost:
          "border-transparent bg-transparent text-accent-text hover:bg-amber-subtle hover:text-accent-text",
      },
      size: {
        md: "px-4",
        icon: "w-11 px-0",
      },
    },
    compoundVariants: [{ variant: "ghost", size: "md", className: "px-3" }],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonStyles>;

/** Button classes, merged so a later class (from `className`) wins over a variant's. */
export function buttonVariants(props?: ButtonVariantProps, className?: string) {
  return cn(buttonStyles(props), className);
}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonVariantProps) {
  return <button type={type} className={buttonVariants({ variant, size }, className)} {...props} />;
}
