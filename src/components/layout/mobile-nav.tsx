"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { isCurrentSection, MAIN_NAV } from "@/config/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Phone navigation: a menu button that opens a sheet under the header.
 * Closes on Escape, on a tap outside, and after navigating.
 */
export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sheetId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close after a navigation.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={className}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={sheetId}
        className={buttonVariants({ variant: "secondary", size: "icon" })}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
      </button>

      <nav
        id={sheetId}
        aria-label="Main"
        hidden={!open}
        className="tpb-sheet absolute inset-x-0 top-full z-20 flex flex-col gap-1 border-b border-border bg-surface-raised px-4 pt-2 pb-4 shadow-[var(--shadow-pop)]"
      >
        {MAIN_NAV.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isCurrentSection(pathname, link.href) ? "page" : undefined}
            className={cn(
              "group flex min-h-12 items-center justify-between rounded-md px-3 font-display text-[16px]/[24px] font-semibold text-text no-underline",
              "transition-colors duration-[180ms] ease-tpb hover:bg-surface hover:text-text",
              "aria-[current=page]:bg-amber-subtle",
            )}
          >
            {link.label}
            <ChevronRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-tpb group-hover:translate-x-[3px]"
            />
          </Link>
        ))}
      </nav>
    </div>
  );
}
