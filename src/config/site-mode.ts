import "server-only";

/*
 * The launch switch. Production shows only the coming-soon page until launch;
 * local development and Vercel preview deployments show the full site, so Stage 1
 * can be merged to main piece by piece without going public early.
 *
 * To launch: set SITE_MODE=live in the Vercel production environment and redeploy.
 */

export type SiteMode = "coming-soon" | "live";

export function resolveSiteMode(env: {
  SITE_MODE?: string | undefined;
  VERCEL_ENV?: string | undefined;
}): SiteMode {
  if (env.SITE_MODE === "live" || env.SITE_MODE === "coming-soon") return env.SITE_MODE;
  return env.VERCEL_ENV === "production" ? "coming-soon" : "live";
}

export const siteMode: SiteMode = resolveSiteMode({
  SITE_MODE: process.env.SITE_MODE,
  VERCEL_ENV: process.env.VERCEL_ENV,
});

export const isLive = siteMode === "live";

/** Internal pages, such as the design-system preview, never ship to production. */
export const showInternalPages = process.env.VERCEL_ENV !== "production";
