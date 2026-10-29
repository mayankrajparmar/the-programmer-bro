import type { Metadata } from "next";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { SkipLink } from "@/components/layout/skip-link";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Admin pages: a slim header, no site navigation. Every page checks the session itself. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <SkipLink />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-page items-center gap-3 px-4 sm:h-16 sm:px-6">
          <BrandLockup href="/" />
          <span className="rounded-sm border border-border px-2 py-0.5 font-display text-label text-text-muted">
            Admin
          </span>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
    </div>
  );
}
