import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Leave out for the current page. */
  href?: string;
}

/** Where this page sits, e.g. Learn / How AI Works / Module B. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-small text-text-muted">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <li aria-hidden="true" className="select-none">
                /
              </li>
            )}
            <li>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-11 items-center text-text-muted no-underline hover:text-text hover:underline hover:underline-offset-4",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-text">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
