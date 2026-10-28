import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardMeta, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import type { Track } from "../server/content";

/** /learn: every track. One for now; Prompt Engineering joins in Stage 2. */
export function LearnPage({ tracks }: { tracks: Track[] }) {
  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6 sm:pt-12">
      <header className="flex max-w-lesson flex-col gap-3 pb-8">
        <h1 className="m-0 font-display text-h1 max-sm:text-[30px]/[38px]">Learn</h1>
        <p className="m-0">
          Short lessons in plain English, each with a quiz at the end. Start at the beginning, or
          jump to the lesson you need.
        </p>
      </header>

      <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-2">
        {tracks.map((track) => {
          const published = track.lessons.filter((lesson) => lesson.published).length;
          return (
            <Card as="li" key={track.slug} className="content-start gap-3">
              <CardMeta>
                <Tag tone="level">{track.level}</Tag>
                <span>
                  {track.lessons.length} lessons · {track.modules.length} modules
                  {published < track.lessons.length && ` · ${published} out now`}
                </span>
              </CardMeta>
              <CardTitle as="h2" className="text-h3">
                {track.title}
              </CardTitle>
              <CardBody>{track.description}</CardBody>
              <div className="pt-2">
                <Link
                  href={track.href}
                  className={buttonVariants({ variant: "primary" }, "group px-5")}
                >
                  Open the track
                  <ArrowRight aria-hidden className="size-4 group-hover:translate-x-[3px]" />
                </Link>
              </div>
            </Card>
          );
        })}
      </ul>

      <p className="mt-8 mb-0 text-small text-text-muted">
        More tracks are on the way. Prompt Engineering is next.
      </p>
    </div>
  );
}
