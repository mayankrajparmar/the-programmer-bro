import { delay } from "@/lib/motion";
import { toNewsView, type NewsItem } from "../view";
import { NewsBrowser } from "./news-browser";

/** /news: approved AI stories in plain English, grouped by day, filterable by topic. */
export function NewsPage({ items }: { items: NewsItem[] }) {
  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6 sm:pt-12">
      <header className="flex max-w-lesson flex-col gap-4">
        <h1 className="tpb-in m-0 font-display text-h1 max-sm:text-[30px]/[38px]">AI News</h1>
        <p className="tpb-in m-0" style={delay(0.08)}>
          The day&apos;s AI news in plain English, picked and summarised for developers and students
          in India. Every item links to its source.
        </p>
      </header>

      <NewsBrowser stories={items.map(toNewsView)} />
    </div>
  );
}
