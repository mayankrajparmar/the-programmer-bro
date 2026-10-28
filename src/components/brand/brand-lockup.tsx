import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/*
 * The PB logo beside the "The Programmer Bro" wordmark, both amber on dark and
 * light backgrounds, 48px tall as in the page designs. Pass `href` to make the
 * lockup a link (the header and footer link it home).
 */

const LOGO_RATIO = 982 / 689; // viewBox of public/brand/pb-logo-amber.svg
const WORDMARK_RATIO = 274 / 112; // viewBox of public/brand/wordmark-amber.svg

export function BrandLockup({
  height = 48,
  href,
  className,
  style,
}: {
  height?: number;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const images = (
    <>
      <Image
        src="/brand/pb-logo-amber.svg"
        alt=""
        width={Math.round(height * LOGO_RATIO)}
        height={height}
        loading="eager"
        className="block"
      />
      <Image
        src="/brand/wordmark-amber.svg"
        alt=""
        width={Math.round(height * WORDMARK_RATIO)}
        height={height}
        loading="eager"
        className="block"
      />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`${site.name} home`}
        className={cn("flex flex-none items-center gap-3 rounded-md no-underline", className)}
        style={style}
      >
        {images}
      </Link>
    );
  }

  return (
    <div
      role="img"
      aria-label={site.name}
      className={cn("flex items-center gap-3", className)}
      style={style}
    >
      {images}
    </div>
  );
}
