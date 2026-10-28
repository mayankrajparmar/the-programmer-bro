"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { isCurrentSection, MAIN_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Desktop navigation: the current section gets an amber underline. */
export function MainNav({ className }: { className?: string }) {
  return (
    <nav aria-label="Main" className={cn("flex h-full items-stretch", className)}>
      {/* The pathname may not be known while prerendering; links render without a current one. */}
      <Suspense fallback={<NavLinks pathname={null} />}>
        <CurrentNavLinks />
      </Suspense>
    </nav>
  );
}

function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return MAIN_NAV.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      aria-current={isCurrentSection(pathname, link.href) ? "page" : undefined}
      className={cn(
        "relative flex items-center px-4 font-display text-label text-text no-underline hover:text-text",
        "after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-pill after:bg-text-muted",
        "after:transition-transform after:duration-200 after:ease-tpb hover:after:scale-x-100",
        "aria-[current=page]:after:scale-x-100 aria-[current=page]:after:bg-amber",
      )}
    >
      {link.label}
    </Link>
  ));
}
