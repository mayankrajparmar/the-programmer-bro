import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { FOOTER_SITE_LINKS } from "@/config/navigation";
import { site } from "@/config/site";
import { FooterCredits } from "./footer-credits";

const linkClass =
  "group inline-flex min-h-11 items-center gap-2 text-text no-underline hover:text-text hover:underline hover:underline-offset-4";

const headingClass = "m-0 mb-1 font-display text-label text-text-muted";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-page flex-col gap-8 px-4 pt-10 pb-6 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-12 sm:px-6 sm:pt-12 sm:pb-8">
        <div className="flex max-w-[400px] flex-col items-start gap-4 sm:flex-[1_1_320px]">
          <BrandLockup href="/" />
          <p className="m-0 text-small text-text-muted">
            Free lessons that teach AI from the basics to expert level, written for developers and
            students in India.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-12 gap-y-8">
          <div>
            <h2 className={headingClass}>The site</h2>
            <ul className="m-0 list-none p-0">
              {FOOTER_SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} prefetch={false} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {site.social.length > 0 && (
            <div>
              <h2 className={headingClass}>Follow us</h2>
              <ul className="m-0 list-none p-0">
                {site.social.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="me noopener" className={linkClass}>
                      {link.label} <span className="sr-only">(opens in a new tab)</span>
                      <ExternalLink
                        aria-hidden
                        className="size-4 transition-transform duration-200 ease-tpb group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>

      <div className="border-t border-border">
        <FooterCredits className="mx-auto max-w-page px-4 py-4 sm:px-6" />
      </div>
    </footer>
  );
}
