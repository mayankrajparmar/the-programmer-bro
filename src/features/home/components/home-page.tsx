import { ContinueLearning, type Track, type UpcomingTrack } from "@/features/learn";
import type { NewsItem } from "@/features/news";
import { ComingNext } from "./coming-next";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { LatestNews } from "./latest-news";

const section = "mx-auto max-w-page px-4 sm:px-6";

/**
 * The home page, per the Home artboards: the promise and the tokenizer demo, where to start
 * (or carry on), how it works, the latest AI news, and the tracks coming next.
 */
export function HomePage({
  track,
  news,
  upcoming,
}: {
  /** The track to start with: the first one. */
  track: Track | null;
  news: NewsItem[];
  upcoming: UpcomingTrack[];
}) {
  const first = track?.lessons.find((lesson) => lesson.published);
  const start = first
    ? { href: first.href, label: `Start lesson ${first.number}` }
    : { href: track?.href ?? "/learn", label: "See the lessons" };

  return (
    <>
      <Hero start={start} />
      {track && <ContinueLearning track={track} className={`tpb-reveal ${section} py-12`} />}
      <HowItWorks className={`${section} pb-12`} />
      <LatestNews items={news} className={`${section} pb-12`} />
      <ComingNext tracks={upcoming} after={track?.title ?? "our first track"} className={section} />
    </>
  );
}
