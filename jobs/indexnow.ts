/**
 * The IndexNow job: after a production release, tells Bing and the other IndexNow search
 * engines which pages changed. GitHub Actions runs it when Vercel finishes deploying a
 * commit on main (.github/workflows/indexnow.yml), and you can run it by hand there too.
 *
 *   node jobs/indexnow.ts --since 2026-11-02   pages whose sitemap date is on or after this day
 *   --previous-release 2026-11-02              pages dated from the day before that release
 *                                              (what the workflow uses after each deploy)
 *   node jobs/indexnow.ts --all                every page in the sitemap
 *   --dry-run                                  print what would be sent, and send nothing
 *   --site http://localhost:3000               read the pages from another copy of the site,
 *                                              such as a local production build (for testing)
 *
 * It reads the live site, so it only ever sends pages that are really published: drafts
 * aren't in the sitemap. It needs no secrets.
 */
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  buildPayload,
  dayBefore,
  describeResponse,
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  parseSitemap,
  selectUrls,
  SITE_URL,
  siteIsLive,
} from "./indexnow/indexnow.ts";

const { values: args } = parseArgs({
  options: {
    since: { type: "string" },
    "previous-release": { type: "string" },
    all: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    site: { type: "string", default: SITE_URL },
  },
});
const origin = args.site;

function finish(lines: string[], failed = false): never {
  const text = lines.join("\n");
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## IndexNow\n\n${text}\n`);
  }
  process.exit(failed ? 1 : 0);
}

async function text(path: string): Promise<string> {
  const url = `${origin}${path}`;
  const response = await fetch(url, {
    headers: { "user-agent": "theprogrammerbro-indexnow" },
  }).catch((error: Error) => finish([`Couldn't reach ${url}: ${error.message}`], true));
  if (!response.ok) finish([`${url} answered ${response.status}.`], true);
  return response.text();
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const previous = args["previous-release"];
const since = previous && DATE.test(previous) ? dayBefore(previous) : args.since;
if (!args.all && !DATE.test(since ?? "")) {
  finish(["Give --since YYYY-MM-DD, --previous-release YYYY-MM-DD, or --all."], true);
}

if (!siteIsLive(await text("/robots.txt"))) {
  finish(["The site isn't open to search engines yet (coming-soon mode), so nothing was sent."]);
}

const urls = selectUrls(
  parseSitemap(await text("/sitemap.xml")),
  args.all ? null : (since ?? null),
);
const scope = args.all ? "every page" : `pages changed on or after ${since}`;
if (urls.length === 0) finish([`No ${scope} in the sitemap, so nothing was sent.`]);

const list = urls.map((url) => `- ${url}`);
if (args["dry-run"]) finish([`Dry run: would send ${urls.length} URLs (${scope}):`, ...list]);

const served = (await text(`/${INDEXNOW_KEY}.txt`)).trim();
if (served !== INDEXNOW_KEY) {
  finish([`The key file at ${origin}/${INDEXNOW_KEY}.txt doesn't contain the key.`], true);
}

if (origin !== SITE_URL) {
  finish([`Read from ${origin}, so nothing was sent: IndexNow only takes the live site.`, ...list]);
}

const response = await fetch(INDEXNOW_ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(buildPayload(urls)),
}).catch((error: Error) => finish([`Couldn't reach IndexNow: ${error.message}`], true));
const { ok, message } = describeResponse(response.status);
finish([`${message} ${urls.length} URLs (${scope}):`, ...list], !ok);
