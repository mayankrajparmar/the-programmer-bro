import { Clock } from "lucide-react";
import { Tag } from "@/components/ui/tag";
import type { UpcomingTrack } from "@/features/learn";
import { stagger } from "@/lib/motion";

/** The tracks being written after the current one. */
export function ComingNext({
  tracks,
  after,
  className,
}: {
  tracks: UpcomingTrack[];
  /** The title of the track that's out now. */
  after: string;
  className?: string;
}) {
  if (tracks.length === 0) return null;
  return (
    <section aria-labelledby="next-title" className={className}>
      <div className="tpb-reveal">
        <h2 id="next-title" className="m-0 mb-2 font-display text-h2">
          Coming next
        </h2>
        <p className="m-0 mb-6 text-text-muted">The tracks we&apos;re writing after {after}.</p>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-12 border-t border-border p-0">
        {tracks.map((track, index) => (
          <li
            key={track.title}
            className="tpb-reveal flex min-h-16 min-w-0 flex-[1_1_480px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-border py-3"
            style={stagger(index % 2)}
          >
            <span className="flex-[1_1_auto] font-display text-title max-sm:basis-full">
              {track.title}
            </span>
            <Tag tone="level">{track.level}</Tag>
            <span className="inline-flex w-[116px] flex-none items-center gap-1 text-small text-text-muted">
              <Clock aria-hidden className="size-4" />
              Coming soon
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
