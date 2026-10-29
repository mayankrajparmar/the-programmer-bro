import { createHash } from "node:crypto";

/** Query parameters that only track where a click came from. */
const TRACKING = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "yclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "_hsenc",
  "_hsmi",
  "ref",
  "ref_src",
  "ref_url",
  "cmpid",
  "ocid",
  "sr_share",
  "guccounter",
  "guce_referrer",
  "guce_referrer_sig",
  "spm",
  "smid",
  "ito",
]);

export interface NormalisedUrl {
  /** The link to store and show: tracking removed, host lowercased, no fragment or trailing slash. */
  url: string;
  /** What identifies the story, ignoring http/https and a leading "www.". */
  key: string;
}

/** Cleans a story link so the same story always gets the same hash. Returns null for non-web links. */
export function normaliseUrl(raw: string): NormalisedUrl | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === "https:" && url.port === "443") || url.port === "80") url.port = "";

  for (const name of [...url.searchParams.keys()]) {
    const lower = name.toLowerCase();
    if (lower.startsWith("utm_") || TRACKING.has(lower)) url.searchParams.delete(name);
  }
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "") || "/";

  const clean = url.toString();
  const host = url.host.replace(/^www\./, "");
  const path = url.pathname === "/" ? "" : url.pathname;
  return { url: clean, key: `${host}${path}${url.search}` };
}

export function hashUrl(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** "www.example.co.in" → "example.co.in", for showing where a Hacker News link goes. */
export function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
