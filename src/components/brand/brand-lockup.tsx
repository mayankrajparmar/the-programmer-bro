import Image from "next/image";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/*
 * The PB logo beside the "The Programmer Bro" wordmark, both amber on dark and
 * light backgrounds. Sizes follow the page designs: 48px tall in the header and
 * on the coming-soon page.
 */

const LOGO_RATIO = 982 / 689; // viewBox of public/brand/pb-logo-amber.svg
const WORDMARK_RATIO = 274 / 112; // viewBox of public/brand/wordmark-amber.svg

export function BrandLockup({
  height = 48,
  className,
  style,
}: {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      role="img"
      aria-label={site.name}
      className={cn("flex items-center gap-3", className)}
      style={style}
    >
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
    </div>
  );
}
