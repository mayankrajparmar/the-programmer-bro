"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import { summarizeProgress } from "../progress/summary";
import { useProgress } from "../progress/use-progress";

export interface ContinueLearningView {
  title: string;
  level: string;
  href: string;
  moduleCount: number;
  lessons: { key: string; number: number; title: string; href: string; published: boolean }[];
}

/**
 * "Start here" for a first visit, "Continue learning" once a lesson is done: the track, how
 * far this browser has got, and a button to the next lesson. Prerenders as a first visit;
 * saved progress appears right after hydration.
 */
export function ContinueLearningCard({
  track,
  className,
}: {
  track: ContinueLearningView;
  className?: string;
}) {
  const progress = useProgress();
  const { doneCount, upNext } = summarizeProgress(progress, track.lessons);
  const total = track.lessons.length;
  const next = track.lessons.find((lesson) => lesson.key === upNext);
  const started = doneCount > 0;
  const anyOut = track.lessons.some((lesson) => lesson.published);

  let action: { href: string; label: string; primary: boolean };
  let note: string;
  if (next) {
    action = {
      href: next.href,
      label: started
        ? `Continue: Lesson ${next.number} · ${next.title}`
        : `Start lesson ${next.number}: ${next.title}`,
      primary: true,
    };
    note = started
      ? "Your progress is saved in this browser."
      : "We'll save your progress in this browser.";
  } else if (!anyOut) {
    action = { href: track.href, label: "See the lesson plan", primary: false };
    note = "The first lessons are being checked and will be out soon.";
  } else {
    action = { href: track.href, label: "Review the track", primary: false };
    note = "You're up to date. New lessons arrive every week.";
  }

  return (
    <section aria-labelledby="continue-title" className={className}>
      <h2 id="continue-title" className="m-0 mb-6 font-display text-h2">
        {started ? "Continue learning" : "Start here"}
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="m-0 font-display text-h3">{track.title}</h3>
            <Tag tone="level">{track.level}</Tag>
          </div>
          <p className="m-0 text-small text-text-muted">
            {total} lessons · {track.moduleCount} modules
          </p>
          <div className="flex max-w-[560px] items-center gap-4">
            <ProgressBar
              label={`${track.title} progress`}
              value={doneCount}
              max={total}
              valueText={`${doneCount} of ${total} lessons done`}
              className="flex-auto"
            />
            <span className="flex-none text-small">
              {doneCount} of {total} lessons done
            </span>
          </div>
        </div>
        <div className="flex flex-[0_1_auto] flex-col items-start gap-2 max-sm:w-full">
          <Link
            href={action.href}
            className={buttonVariants(
              { variant: action.primary ? "primary" : "secondary" },
              cn("group px-5 text-left max-sm:w-full"),
            )}
          >
            {action.label}
            <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
          </Link>
          <p className="m-0 text-small text-text-muted">{note}</p>
        </div>
      </div>
    </section>
  );
}
