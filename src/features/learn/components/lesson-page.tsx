import { ArrowLeft, ArrowRight, Flag } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Callout } from "@/components/ui/callout";
import { InlineCode } from "@/components/ui/code-block";
import { Tag } from "@/components/ui/tag";
import { compileMdx } from "@/lib/mdx";
import { delay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { lessonKey } from "../progress/progress-store";
import { LessonQuiz } from "../quiz/lesson-quiz";
import type { Source } from "../schema";
import type { Lesson, LessonSummary } from "../server/content";
import { lessonComponents } from "./mdx-components";
import { MobileTableOfContents, TableOfContents } from "./table-of-contents";

const reviewedFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A lesson: header, "In short", the MDX body, the quiz, sources and links to the neighbours. */
export function LessonPage({ lesson }: { lesson: Lesson }) {
  const { Content, headings } = compileMdx(lesson.body);
  const { frontmatter } = lesson;

  return (
    <div className="mx-auto max-w-page px-4 pt-6 sm:px-6">
      <Breadcrumbs
        className="tpb-in"
        items={[
          { label: "Learn", href: "/learn" },
          { label: lesson.track.title, href: lesson.track.href },
          {
            label: `Module ${lesson.module.id}`,
            href: `${lesson.track.href}#module-${lesson.module.id.toLowerCase()}`,
          },
        ]}
      />

      <div className="flex flex-wrap items-start gap-x-20 gap-y-12">
        <article className="max-w-lesson min-w-0 flex-[1_1_560px]">
          <header className="flex flex-col gap-4 pt-4 pb-8">
            <h1
              className="tpb-in m-0 font-display text-h1 max-sm:text-[30px]/[38px]"
              style={delay(0.08)}
            >
              {lesson.title}
            </h1>
            <div
              className="tpb-in flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-text-muted"
              style={delay(0.16)}
            >
              <Tag tone="level">{lesson.track.level}</Tag>
              <span>
                Lesson {lesson.number} of {lesson.total}
              </span>
              <span aria-hidden="true">·</span>
              <span>{lesson.readingMinutes} min read</span>
              <span aria-hidden="true" className="max-sm:hidden">
                ·
              </span>
              <span>
                {frontmatter.draft ? "Draft, " : ""}last reviewed{" "}
                {reviewedFormat.format(new Date(`${frontmatter.lastReviewed}T00:00:00Z`))}
              </span>
            </div>
          </header>

          {frontmatter.draft && (
            <Callout kind="warn" title="Draft: waiting for review" className="mb-6">
              <p>
                This lesson shows on preview builds only. Check it for accuracy, then set{" "}
                <InlineCode>draft: false</InlineCode> to publish it.
              </p>
            </Callout>
          )}

          {headings.length > 2 && (
            <div className="tpb-in mb-6 lg:hidden" style={delay(0.22)}>
              <MobileTableOfContents headings={headings} />
            </div>
          )}

          <section
            aria-label="In short"
            className="tpb-in flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 sm:p-6"
            style={delay(0.26)}
          >
            <p className="m-0 font-display text-label text-accent-text">In short</p>
            <p className="m-0 text-lesson">{frontmatter.inShort}</p>
          </section>

          <div className="tpb-prose mt-8">
            <Content components={lessonComponents} />
          </div>

          <LessonQuiz
            progressKey={lessonKey(lesson.track.slug, lesson.slug)}
            questions={lesson.quiz.questions}
            trackHref={lesson.track.href}
            next={
              lesson.next && {
                number: lesson.next.number,
                title: lesson.next.title,
                href: lesson.next.href,
                published: lesson.next.published,
              }
            }
          />

          <Sources sources={frontmatter.sources} />

          <Pager previous={lesson.previous} next={lesson.next} />

          <Link
            href={`/contact?about=${encodeURIComponent(lesson.href)}`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-small text-text-muted no-underline hover:text-text hover:underline hover:underline-offset-4"
          >
            <Flag aria-hidden className="size-4" />
            Report an error in this lesson
          </Link>
        </article>

        {headings.length > 2 && (
          <aside
            className="tpb-in sticky top-6 ml-auto hidden w-60 flex-none self-start pt-6 lg:block"
            style={delay(0.4)}
          >
            <TableOfContents headings={headings} />
          </aside>
        )}
      </div>
    </div>
  );
}

function Sources({ sources }: { sources: Source[] }) {
  return (
    <section aria-labelledby="sources-title" className="flex flex-col gap-4 pt-12">
      <h2 id="sources-title" className="m-0 font-display text-h2">
        Sources and further reading
      </h2>
      <ul className="m-0 list-none border-t border-border p-0">
        {sources.map((source) => (
          <li key={source.url} className="flex flex-col border-b border-border pt-1 pb-3">
            <a
              href={source.url}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center gap-1.5 self-start text-accent-text underline underline-offset-[3px] hover:text-text"
            >
              {source.title}
              <span className="sr-only">, {source.type.toLowerCase()} (opens in a new tab)</span>
            </a>
            <span className="text-small text-text-muted">
              {source.type} · {source.note}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Pager({ previous, next }: { previous: LessonSummary | null; next: LessonSummary | null }) {
  if (!previous && !next) return null;
  return (
    <nav aria-label="Lessons" className="mt-12 flex flex-wrap gap-4">
      {previous && <PagerCard lesson={previous} direction="previous" />}
      {next && <PagerCard lesson={next} direction="next" />}
    </nav>
  );
}

function PagerCard({
  lesson,
  direction,
}: {
  lesson: LessonSummary;
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";
  const label = (
    <span className="inline-flex items-center gap-1 text-small text-text-muted">
      {!isNext && <ArrowLeft aria-hidden className="size-4" />}
      {isNext ? "Next" : "Previous"} · Lesson {lesson.number}
      {isNext && <ArrowRight aria-hidden className="size-4" />}
    </span>
  );
  const box = cn(
    "flex min-w-0 flex-[1_1_260px] flex-col gap-1 rounded-lg border border-border bg-surface px-5 py-4",
    isNext && "items-end text-right",
  );

  if (!lesson.published) {
    return (
      <div className={cn(box, "text-text-muted")}>
        {label}
        <span className="font-display text-title">{lesson.title}</span>
        <span className="text-small">Coming soon</span>
      </div>
    );
  }

  return (
    <Link
      href={lesson.href}
      className={cn(
        box,
        "text-text no-underline transition-[border-color,transform] duration-200 ease-tpb hover:-translate-y-[3px] hover:border-border-strong hover:text-text",
      )}
    >
      {label}
      <span className="font-display text-title">{lesson.title}</span>
    </Link>
  );
}
