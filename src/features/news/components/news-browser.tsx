"use client";

import { ArrowRight, Check, ChevronDown, Newspaper } from "lucide-react";
import { Fragment, useState, useSyncExternalStore } from "react";
import { AdSlot } from "@/components/ui/ad-slot";
import { buttonVariants } from "@/components/ui/button";
import { adsEnabled } from "@/config/ads";
import { delay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { dayHeading, dayKey } from "../dates";
import { NEWS_TOPICS, TOPIC_LABELS, type NewsTopic } from "../topics";
import { filterByTopic, groupByDay, type NewsView } from "../view";
import { NewsCard } from "./news-card";

/** Stories shown at first, and added by each "Show older news". */
export const PAGE_SIZE = 15;

// "Today" depends on the reader's clock, so it's worked out in the browser after hydration;
// the prerendered page shows dates instead.
const noSubscription = () => () => {};
const readToday = () => dayKey(new Date());
const unknownToday = () => null;

/** Topic chips over the stories, grouped by day, newest first. */
export function NewsBrowser({ stories }: { stories: NewsView[] }) {
  const [topic, setTopic] = useState<NewsTopic | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const today = useSyncExternalStore(noSubscription, readToday, unknownToday);

  const matching = filterByTopic(stories, topic);
  const shown = matching.slice(0, limit);
  const days = groupByDay(shown);
  const label = topic ? TOPIC_LABELS[topic] : null;

  // With a topic picked, today keeps its place (with a note) when it has no stories on that topic.
  const todayStory = today ? stories.find((story) => story.day === today) : undefined;
  const todayIsEmpty =
    topic !== null && todayStory !== undefined && !matching.some((story) => story.day === today);

  function choose(next: NewsTopic | null) {
    setTopic(next);
    setLimit(PAGE_SIZE);
  }

  // Ads go after the third story, once they switch on in Stage 4.
  const adAfter = adsEnabled ? shown[2]?.id : undefined;

  return (
    <>
      <div
        role="group"
        aria-label="Filter by topic"
        className="tpb-in mt-6 flex flex-wrap gap-2"
        style={delay(0.16)}
      >
        {[null, ...NEWS_TOPICS].map((option) => {
          const pressed = option === topic;
          return (
            <button
              key={option ?? "all"}
              type="button"
              aria-pressed={pressed}
              onClick={() => choose(option)}
              className={cn(
                buttonVariants({ variant: "secondary" }, "gap-1.5 rounded-pill px-4"),
                pressed && "border-amber bg-amber-subtle hover:border-amber hover:bg-amber-subtle",
              )}
            >
              {pressed && <Check aria-hidden className="size-4" />}
              {option ? TOPIC_LABELS[option] : "All"}
            </button>
          );
        })}
      </div>

      <p role="status" className="sr-only">
        {stories.length === 0
          ? ""
          : `Showing ${shown.length} of ${matching.length} ${label ? `${label} ` : ""}stories`}
      </p>

      {stories.length === 0 ? (
        <EmptyState
          title="No news yet."
          body="The first stories arrive soon. Check back tomorrow."
        />
      ) : matching.length === 0 ? (
        <EmptyState
          title={`No ${label} news yet.`}
          body="Check back tomorrow, or see all news."
          onShowAll={() => choose(null)}
        />
      ) : (
        <>
          {todayIsEmpty && todayStory && (
            <DaySection id={`day-${todayStory.day}`} title="Today" subtitle={todayStory.date}>
              <li>
                <EmptyState
                  inline
                  title={`No ${label} news today.`}
                  body="Check back tomorrow, or see all news."
                  onShowAll={() => choose(null)}
                />
              </li>
            </DaySection>
          )}

          {days.map((day) => {
            const heading = dayHeading(day, today);
            return (
              <DaySection
                key={day.key}
                id={`day-${day.key}`}
                title={heading.title}
                subtitle={heading.subtitle}
              >
                {day.items.map((story) => (
                  <Fragment key={story.id}>
                    <li>
                      <NewsCard story={story} />
                    </li>
                    {story.id === adAfter && (
                      <li>
                        <AdSlot className="my-0 max-w-none" />
                      </li>
                    )}
                  </Fragment>
                ))}
              </DaySection>
            );
          })}

          {matching.length > limit && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                className={buttonVariants({ variant: "secondary" }, "group px-5")}
                onClick={() => setLimit((current) => current + PAGE_SIZE)}
              >
                Show older news
                <ChevronDown aria-hidden className="size-4 group-hover:translate-y-0.5" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function DaySection({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="mt-12 flex flex-wrap items-start gap-x-12 gap-y-4 border-t border-border pt-6"
    >
      <div className="flex items-baseline gap-2 max-md:w-full md:sticky md:top-6 md:flex-[0_0_200px] md:flex-col md:gap-0.5">
        <h2 id={id} className="m-0 font-display text-title">
          {title}
        </h2>
        <p className="m-0 text-small text-text-muted">{subtitle}</p>
      </div>
      <ul className="m-0 flex max-w-[840px] min-w-0 flex-[1_1_600px] list-none flex-col gap-4 p-0">
        {children}
      </ul>
    </section>
  );
}

function EmptyState({
  title,
  body,
  onShowAll,
  inline = false,
}: {
  title: string;
  body: string;
  onShowAll?: () => void;
  inline?: boolean;
}) {
  const Heading = inline ? "h3" : "h2";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-border bg-bg px-6 py-12 text-center",
        !inline && "mt-12",
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-md border border-border bg-surface-raised text-text-muted">
        <Newspaper aria-hidden className="size-5" />
      </span>
      <Heading className="m-0 font-display text-title">{title}</Heading>
      <p className="m-0 text-text-muted">{body}</p>
      {onShowAll && (
        <button
          type="button"
          className={buttonVariants({ variant: "ghost" }, "group text-text")}
          onClick={onShowAll}
        >
          See all news
          <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
        </button>
      )}
    </div>
  );
}
