"use client";

import { Moon, Sun } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/*
 * Two buttons, and CSS shows the one for the current theme. The theme is set on
 * <html> before React hydrates, so rendering both avoids a mismatch or a flash.
 */

const toggle = cn(
  buttonVariants({ variant: "secondary", size: "icon" }),
  "hover:[&_svg]:rotate-[30deg]",
);

export function ThemeToggle() {
  return (
    <>
      <button
        type="button"
        aria-label="Switch to light theme"
        className={cn(toggle, "light:hidden")}
        onClick={() => applyTheme("light")}
      >
        <Sun aria-hidden className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Switch to dark theme"
        className={cn(toggle, "hidden light:inline-flex")}
        onClick={() => applyTheme("dark")}
      >
        <Moon aria-hidden className="size-5" />
      </button>
    </>
  );
}
