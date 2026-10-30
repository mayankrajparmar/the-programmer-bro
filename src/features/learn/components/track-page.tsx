import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tag } from "@/components/ui/tag";
import { JsonLd } from "@/features/seo";
import { delay } from "@/lib/motion";
import { lessonKey } from "../progress/progress-store";
import type { Track } from "../server/content";
import { trackJsonLd } from "../server/structured-data";
import { TrackOverview, type TrackModuleView } from "./track-overview";

/** A track's page: what it covers, your progress, and its lessons module by module. */
export function TrackPage({ track }: { track: Track }) {
  const modules: TrackModuleView[] = track.modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      key: lessonKey(track.slug, lesson.slug),
      number: lesson.number,
      title: lesson.title,
      summary: lesson.summary,
      href: lesson.href,
      published: lesson.published,
      draft: lesson.draft,
      readingMinutes: lesson.readingMinutes,
    })),
  }));

  return (
    <div className="mx-auto max-w-page px-4 pt-6 sm:px-6">
      <JsonLd data={trackJsonLd(track)} />
      <Breadcrumbs
        className="tpb-in"
        items={[{ label: "Learn", href: "/learn" }, { label: track.title }]}
      />

      <header className="flex max-w-lesson flex-col items-start gap-4 pt-4 pb-8">
        <h1
          className="tpb-in m-0 font-display text-h1 max-sm:text-[30px]/[38px]"
          style={delay(0.08)}
        >
          {track.title}
        </h1>
        <p className="tpb-in m-0" style={delay(0.16)}>
          {track.description}
        </p>
        <div className="tpb-in flex flex-wrap items-center gap-3" style={delay(0.24)}>
          <Tag tone="level">{track.level}</Tag>
          <span className="text-small text-text-muted">
            {track.modules.length} modules · new lessons every week
          </span>
        </div>
      </header>

      <TrackOverview trackTitle={track.title} modules={modules} />
    </div>
  );
}
