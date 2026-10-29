import { SiteShell } from "@/components/layout/site-shell";
import { isLive } from "@/config/site-mode";
import { ComingSoonPage } from "@/features/coming-soon";
import { HomePage } from "@/features/home";
import { getTracks, getUpcomingTracks } from "@/features/learn";
import { getLatestNews } from "@/features/news";

/* Prerendered from content files and cached news; refreshed when a story is approved. */
export const ensureStatic = "navigation";

/** "/": the home page once the site is live, the coming-soon page until then. */
export default async function Page() {
  if (!isLive) return <ComingSoonPage />;
  return (
    <SiteShell>
      <HomePage
        track={getTracks()[0] ?? null}
        news={await getLatestNews()}
        upcoming={getUpcomingTracks()}
      />
    </SiteShell>
  );
}
