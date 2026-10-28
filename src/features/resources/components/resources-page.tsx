import { MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import { delay } from "@/lib/motion";
import type { ResourceView } from "../server/resources";
import { ResourceBrowser } from "./resource-browser";

/** /resources: hand-picked courses, videos, papers, tools and books, filterable by level and type. */
export function ResourcesPage({ resources }: { resources: ResourceView[] }) {
  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6 sm:pt-12">
      <header className="flex max-w-lesson flex-col gap-4">
        <h1 className="tpb-in m-0 font-display text-h1 max-sm:text-[30px]/[38px]">Resources</h1>
        <p className="tpb-in m-0" style={delay(0.08)}>
          Hand-picked courses, videos, papers and tools worth your time, each with a note on why and
          which lesson it pairs with.
        </p>
      </header>

      <ResourceBrowser resources={resources} />

      <p className="mt-12 mb-0 flex flex-wrap items-center justify-center gap-2 text-small text-text-muted">
        <MessageSquarePlus aria-hidden className="size-4" />
        <span>
          Know something better?{" "}
          <Link
            href="/contact"
            prefetch={false}
            className="text-accent-text underline underline-offset-[3px] hover:text-text"
          >
            Tell us about it
          </Link>
          .
        </span>
      </p>
    </div>
  );
}
