import type { Metadata } from "next";
import { seoMetadata } from "@/features/seo";
import { compileMdx } from "@/lib/mdx";
import { delay } from "@/lib/motion";
import type { PageSlug } from "../schema";
import { getPage } from "../server/pages";
import { pageComponents } from "./page-components";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Title, description, canonical URL and share card for a page, from its frontmatter. */
export function pageMetadata(slug: PageSlug): Metadata {
  const { frontmatter } = getPage(slug);
  return seoMetadata({
    title: frontmatter.title,
    description: frontmatter.description,
    path: `/${slug}`,
  });
}

/** About, Privacy, Terms, AI-content disclaimer and Contact: a heading, a date and prose. */
export function ContentPage({ slug }: { slug: PageSlug }) {
  const { frontmatter, body } = getPage(slug);
  const { Content } = compileMdx(body);
  return (
    <div className="mx-auto max-w-page px-4 pt-10 sm:px-6 sm:pt-12">
      <article className="max-w-lesson">
        <header className="flex flex-col gap-4 pb-8">
          <h1 className="tpb-in m-0 font-display text-h1 max-sm:text-[30px]/[38px]">
            {frontmatter.title}
          </h1>
          <p className="tpb-in m-0 text-lesson" style={delay(0.08)}>
            {frontmatter.description}
          </p>
          <p className="tpb-in m-0 text-small text-text-muted" style={delay(0.16)}>
            Last updated{" "}
            <time dateTime={frontmatter.lastUpdated}>
              {dateFormat.format(new Date(`${frontmatter.lastUpdated}T00:00:00Z`))}
            </time>
          </p>
        </header>
        <div className="tpb-prose tpb-in" style={delay(0.24)}>
          <Content components={pageComponents} />
        </div>
      </article>
    </div>
  );
}
