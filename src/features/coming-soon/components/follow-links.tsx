import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { SocialLink } from "@/config/site";
import { cn } from "@/lib/utils";

/** "Follow along as we build it": one button per social profile. Renders nothing without links. */
export function FollowLinks({
  links,
  className,
  style,
}: {
  links: readonly SocialLink[];
  className?: string;
  style?: React.CSSProperties;
}) {
  if (links.length === 0) return null;

  return (
    <nav
      aria-labelledby="follow-label"
      className={cn("flex w-full flex-col items-center gap-3 sm:w-auto", className)}
      style={style}
    >
      <p id="follow-label" className="m-0 font-display text-label text-text-muted">
        Follow along as we build it
      </p>
      <ul className="m-0 grid w-full list-none grid-cols-2 gap-3 p-0 sm:flex sm:flex-wrap sm:justify-center">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="me noopener"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "group w-full bg-bg px-3 py-3 sm:w-auto sm:px-5",
              )}
            >
              {link.label} <span className="sr-only">(opens in a new tab)</span>
              <ExternalLink
                aria-hidden
                className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2}
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
