import { ArrowRight, Newspaper } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NewsCard, toNewsView, type NewsItem } from "@/features/news";
import { stagger } from "@/lib/motion";

/** The three newest approved stories, with a link to the rest. */
export function LatestNews({ items, className }: { items: NewsItem[]; className?: string }) {
  const stories = items.slice(0, 3).map(toNewsView);
  return (
    <section aria-labelledby="news-title" className={className}>
      <div className="tpb-reveal mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id="news-title" className="m-0 font-display text-h2">
          Latest AI news
        </h2>
        <Link
          href="/news"
          className={buttonVariants({ variant: "ghost" }, "group text-text max-sm:hidden")}
        >
          All AI news
          <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
        </Link>
      </div>

      {stories.length > 0 ? (
        <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-2">
          {stories.map((story, index) => (
            <li
              key={story.id}
              className="tpb-reveal grid min-w-0 md:[&:last-child:nth-child(odd)]:col-span-2"
              style={stagger(index)}
            >
              <NewsCard story={story} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-4 sm:p-6">
          <span className="flex size-11 flex-none items-center justify-center rounded-md border border-border bg-surface-raised text-text-muted">
            <Newspaper aria-hidden className="size-5" />
          </span>
          <p className="m-0 min-w-0 flex-1">
            The first stories arrive soon: the day&apos;s AI news, summarised in plain English.
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-center sm:hidden">
        <Link href="/news" className={buttonVariants({ variant: "ghost" }, "group text-text")}>
          All AI news
          <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
        </Link>
      </div>
    </section>
  );
}
