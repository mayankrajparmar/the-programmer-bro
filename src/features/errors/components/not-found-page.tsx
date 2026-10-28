import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { DotGrid } from "@/components/brand/dot-grid";
import { buttonVariants } from "@/components/ui/button";

/** The 404 page, in the coming-soon page's style so it works before and after launch. */
export function NotFoundPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg text-text">
      <DotGrid />
      <main className="relative flex flex-auto flex-col items-center justify-center gap-6 px-4 py-12 text-center sm:px-6 sm:py-16">
        <BrandLockup href="/" />
        <div className="flex flex-col items-center gap-3">
          <p className="m-0 font-mono text-code text-text-muted">404</p>
          <h1 className="m-0 font-display text-h1 max-sm:text-[30px]/[38px]">Page not found</h1>
          <p className="m-0 max-w-[480px]">
            This page doesn&apos;t exist, or it hasn&apos;t launched yet. Check the address, or
            start again from the home page.
          </p>
        </div>
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          <ArrowLeft aria-hidden className="size-4" />
          Go to the home page
        </Link>
      </main>
    </div>
  );
}
