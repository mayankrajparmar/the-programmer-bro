import { BrandLockup } from "@/components/brand/brand-lockup";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

/*
 * Site header, per the page designs: logo home link, the three sections
 * right-aligned, then the theme switch. Below 640px the sections fold into a
 * menu. It doesn't stick, so lessons get the whole screen for reading.
 *
 * Routes under the header must be static or use generateStaticParams, so the
 * current section is known when the page is prerendered.
 */
export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-page items-center gap-2 px-4 sm:h-16 sm:gap-6 sm:px-6">
        <BrandLockup href="/" className="mr-auto" />
        <MainNav className="max-sm:hidden" />
        <ThemeToggle />
        <MobileNav className="sm:hidden" />
      </div>
    </header>
  );
}
