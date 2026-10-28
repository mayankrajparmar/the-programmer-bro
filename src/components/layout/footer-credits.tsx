import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/** The bottom line of every footer: copyright, and who built the site. */
export function FooterCredits({
  align = "between",
  className,
}: {
  /** "between" spreads the two parts apart (site footer); "center" keeps them together. */
  align?: "between" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-text-muted",
        align === "between" ? "justify-between" : "justify-center text-center",
        className,
      )}
    >
      <p className="m-0">© 2026 {site.name}</p>
      {align === "center" && (
        <span aria-hidden="true" className="max-sm:hidden">
          ·
        </span>
      )}
      <p className="m-0">
        Developed by{" "}
        <a
          href={site.author.url}
          rel="author"
          className="text-text underline underline-offset-4 hover:text-accent-text"
        >
          {site.author.name}
        </a>
      </p>
    </div>
  );
}
