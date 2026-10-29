import "server-only";

/*
 * The launch switch. The site launched on 29 Oct 2026, so every environment shows the
 * full site. To put production back behind the coming-soon page (for maintenance, say),
 * set SITE_MODE=coming-soon in the Vercel production environment and redeploy.
 */

export type SiteMode = "coming-soon" | "live";

export function resolveSiteMode(env: {
  SITE_MODE?: string | undefined;
  VERCEL_ENV?: string | undefined;
}): SiteMode {
  if (env.SITE_MODE === "live" || env.SITE_MODE === "coming-soon") return env.SITE_MODE;
  return "live";
}

export const siteMode: SiteMode = resolveSiteMode({
  SITE_MODE: process.env.SITE_MODE,
  VERCEL_ENV: process.env.VERCEL_ENV,
});

export const isLive = siteMode === "live";

/** Internal pages, such as the design-system preview, never ship to production. */
export const showInternalPages = process.env.VERCEL_ENV !== "production";
