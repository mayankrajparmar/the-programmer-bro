/** Site navigation. Practice joins the main nav in Stage 2, between Learn and AI News. */

export interface NavLink {
  label: string;
  href: string;
}

export const MAIN_NAV: readonly NavLink[] = [
  { label: "Learn", href: "/learn" },
  { label: "AI News", href: "/news" },
  { label: "Resources", href: "/resources" },
];

/** The footer's "The site" column. These pages arrive with the legal step of Stage 1. */
export const FOOTER_SITE_LINKS: readonly NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "AI-content disclaimer", href: "/ai-content" },
  { label: "Contact", href: "/contact" },
];

/** True when `pathname` is the section at `href` or a page inside it. */
export function isCurrentSection(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
