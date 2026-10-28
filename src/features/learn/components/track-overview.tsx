"use client";

import { ArrowRight, CalendarClock, ChevronRight, Circle, CircleCheck } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import { summarizeProgress } from "../progress/summary";
import { useHydrated, useProgress } from "../progress/use-progress";

/*
 * The interactive half of the track page: the progress panel and the lesson
 * lists, whose Done / Up next markers come from this browser's progress.
 */

export interface TrackLessonView {
  key: string;
  number: number;
  title: string;
  summary: string;
  href: string;
  published: boolean;
  draft: boolean;
  readingMinutes: number | null;
}

export interface TrackModuleView {
  id: string;
  title: string;
  lessons: TrackLessonView[];
}

export function TrackOverview({
  trackTitle,
  modules,
}: {
  trackTitle: string;
  modules: TrackModuleView[];
}) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const lessons = modules.flatMap((module) => module.lessons);
  const { done, doneCount, upNext } = summarizeProgress(progress, lessons);
  const total = lessons.length;
  const next = lessons.find((lesson) => lesson.key === upNext);
  const firstVisit = doneCount === 0;

  return (
    <>
      <section
        aria-label="Your progress"
        className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-lg border border-border bg-surface p-4 sm:p-6"
      >
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-2">
          <div className="flex max-w-[640px] items-center gap-4">
            <ProgressBar
              label={`${trackTitle} progress`}
              value={doneCount}
              max={total}
              valueText={`${doneCount} of ${total} lessons done`}
              className="flex-auto"
            />
            <span className="flex-none font-display text-label">
              {doneCount} of {total} lessons done
            </span>
          </div>
          <p className="m-0 text-small text-text-muted">
            {firstVisit
              ? "We'll save your progress in this browser."
              : "Your progress is saved in this browser."}
          </p>
        </div>
        {next ? (
          <Link href={next.href} className={buttonVariants({ variant: "primary" }, "group px-5")}>
            {firstVisit && next.number === 1
              ? "Start lesson 1"
              : `${firstVisit ? "Start" : "Continue"}: Lesson ${next.number}`}
            <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
          </Link>
        ) : (
          hydrated &&
          doneCount > 0 && (
            <p className="m-0 font-display text-label">
              You&apos;re up to date. New lessons arrive every week.
            </p>
          )
        )}
      </section>

      {modules.map((module) => {
        const published = module.lessons.filter((lesson) => lesson.published).length;
        const doneHere = module.lessons.filter((lesson) => done.has(lesson.key)).length;
        const headingId = `module-${module.id.toLowerCase()}`;
        return (
          <section key={module.id} aria-labelledby={headingId} className="pt-12">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 id={headingId} className="m-0 scroll-mt-6 font-display text-h2">
                Module {module.id} · {module.title}
              </h2>
              <span className="text-small text-text-muted">
                {moduleMeta(module.lessons.length, published, doneHere)}
              </span>
            </div>
            <ol className="m-0 list-none overflow-hidden rounded-lg border border-border bg-surface p-0">
              {module.lessons.map((lesson, index) => (
                <li key={lesson.key} className={cn(index > 0 && "border-t border-border")}>
                  <LessonRow
                    lesson={lesson}
                    status={
                      !lesson.published
                        ? "coming"
                        : done.has(lesson.key)
                          ? "done"
                          : lesson.key === upNext
                            ? "next"
                            : "not-started"
                    }
                  />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </>
  );
}

function moduleMeta(count: number, published: number, done: number) {
  const lessons = `${count} ${count === 1 ? "lesson" : "lessons"}`;
  if (published === 0) return `${lessons} · coming soon`;
  if (done === count) return `${lessons} · all done`;
  if (done > 0) return `${lessons} · ${done} done`;
  if (published < count) return `${lessons} · ${published} out now`;
  return lessons;
}

type Status = "done" | "next" | "not-started" | "coming";

const STATUS: Record<Status, { label: string; className: string }> = {
  done: { label: "Done", className: "font-display text-label text-text" },
  next: { label: "Up next", className: "font-display text-label text-accent-text" },
  "not-started": { label: "Not started", className: "text-small text-text-muted" },
  coming: { label: "Coming soon", className: "text-small text-text-muted" },
};

function StatusLabel({ status }: { status: Status }) {
  const Icon = status === "done" ? CircleCheck : status === "coming" ? CalendarClock : Circle;
  return (
    <span className={cn("inline-flex items-center gap-2", STATUS[status].className)}>
      <Icon
        aria-hidden
        className={cn(
          "size-5 flex-none",
          status === "done" && "text-success",
          status === "next" && "tpb-pulse",
        )}
      />
      {STATUS[status].label}
    </span>
  );
}

function LessonRow({ lesson, status }: { lesson: TrackLessonView; status: Status }) {
  const content = (
    <>
      <span
        className={cn(
          "flex size-10 flex-none items-center justify-center rounded-md border font-display text-label",
          status === "next" ? "border-amber" : "border-border",
        )}
      >
        {lesson.number}
      </span>
      <span className="flex min-w-0 flex-auto flex-col gap-1 sm:gap-0.5">
        <span className="font-display text-title">
          {lesson.title}
          {lesson.draft && lesson.published && (
            <span className="ml-2 align-middle font-display text-[12px]/[18px] font-semibold text-danger">
              Draft
            </span>
          )}
        </span>
        <span className={status === "coming" ? "" : "text-text-muted"}>{lesson.summary}</span>
        {/* Phones: time and status sit under the summary. */}
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small sm:hidden">
          {lesson.readingMinutes && (
            <span className="text-text-muted">{lesson.readingMinutes} min read</span>
          )}
          <StatusLabel status={status} />
        </span>
      </span>
      <span className="hidden w-[110px] flex-none text-small text-text-muted sm:block">
        {lesson.readingMinutes ? `${lesson.readingMinutes} min read` : ""}
      </span>
      <span className="hidden w-[130px] flex-none sm:block">
        <StatusLabel status={status} />
      </span>
    </>
  );

  const rowClass =
    "flex items-start gap-3 p-4 sm:min-h-[76px] sm:items-center sm:gap-5 sm:px-6 sm:py-4";

  if (status === "coming") {
    return <div className={cn(rowClass, "text-text-muted")}>{content}</div>;
  }

  return (
    <Link
      href={lesson.href}
      className={cn(
        rowClass,
        "group text-text no-underline transition-colors duration-[180ms] ease-tpb hover:bg-surface-raised hover:text-text",
        status === "next" && "bg-amber-subtle hover:bg-amber-subtle",
      )}
    >
      {content}
      <ChevronRight
        aria-hidden
        className="size-5 flex-none self-center text-text-muted transition-transform duration-200 ease-tpb group-hover:translate-x-[3px]"
      />
    </Link>
  );
}
