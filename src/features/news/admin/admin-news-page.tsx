import { ChevronRight, LogOut, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Tag } from "@/components/ui/tag";
import { requireAdmin, signOut } from "@/features/auth";
import { NEWS_TIME_ZONE } from "../dates";
import { turnSourceOn } from "./actions";
import { loadAdminNews, type AdminNewsData, type JobRun } from "./queries";
import { ReviewCard } from "./review-card";

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: NEWS_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const formatTime = (iso: string) => timeFormat.format(new Date(iso));

const RUN_STATUS: Record<JobRun["status"], { label: string; className: string }> = {
  ok: { label: "OK", className: "border-transparent bg-success-subtle text-success" },
  partial: { label: "Partly OK", className: "border-transparent bg-amber-subtle text-accent-text" },
  failed: { label: "Failed", className: "border-transparent bg-danger-subtle text-danger" },
  running: { label: "Running", className: "border-transparent bg-info-subtle text-info" },
};

/** /admin/news: the drafts waiting for review, stories already live, and the job's health. */
export async function AdminNewsPage() {
  const admin = await requireAdmin();
  return <AdminNewsView email={admin.email} data={await loadAdminNews()} />;
}

/** The queue itself, given the data. */
export function AdminNewsView({ email, data }: { email: string | null; data: AdminNewsData }) {
  return (
    <div className="mx-auto grid max-w-lesson gap-12 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="m-0 font-display text-h1 max-sm:text-[30px]/[38px]">News queue</h1>
          <p className="m-0 text-text-muted">
            Signed in{email ? ` as ${email}` : ""}. Approved stories appear on the News page
            straight away.
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            <LogOut aria-hidden className="size-4" />
            Sign out
          </Button>
        </form>
      </header>

      {!data.configured && (
        <Callout kind="warn" title="No database here">
          <p>Add the Supabase settings to this deployment to review news.</p>
        </Callout>
      )}
      {data.error && (
        <Callout kind="warn" title="Couldn't load the queue">
          <p>{data.error}</p>
        </Callout>
      )}

      <section aria-labelledby="drafts" className="grid gap-4">
        <h2 id="drafts" className="m-0 font-display text-h2">
          Drafts <span className="text-text-muted">({data.drafts.length})</span>
        </h2>
        {data.drafts.length === 0 ? (
          <p className="m-0 text-text-muted">
            No drafts waiting. The news job looks for new stories every four hours.
          </p>
        ) : (
          data.drafts.map((story) => (
            <ReviewCard key={story.id} story={story} published={formatTime(story.publishedAt)} />
          ))
        )}
      </section>

      <section aria-labelledby="live" className="grid gap-4">
        <h2 id="live" className="m-0 font-display text-h2">
          Live on the site
        </h2>
        {data.live.length === 0 ? (
          <p className="m-0 text-text-muted">Nothing approved yet.</p>
        ) : (
          data.live.map((story) => (
            <details key={story.id} className="group rounded-lg border border-border">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-3 font-display text-label [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  aria-hidden
                  className="size-4 shrink-0 transition-transform group-open:rotate-90"
                />
                {story.title}
              </summary>
              <div className="px-2 pb-2">
                <ReviewCard story={story} published={formatTime(story.publishedAt)} live />
              </div>
            </details>
          ))
        )}
      </section>

      <section aria-labelledby="runs" className="grid gap-4">
        <h2 id="runs" className="m-0 font-display text-h2">
          Recent job runs
        </h2>
        {data.runs.length === 0 ? (
          <p className="m-0 text-text-muted">
            The job hasn&apos;t run yet. Start it from GitHub: Actions, News ingest, Run workflow.
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {data.runs.map((run) => (
              <li key={run.id} className="grid gap-2 rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Tag className={RUN_STATUS[run.status].className}>
                    {RUN_STATUS[run.status].label}
                  </Tag>
                  <span className="font-display text-label">{formatTime(run.startedAt)}</span>
                  <span className="text-small text-text-muted">
                    Read {run.fetched}, new {run.fresh}, saved {run.saved}
                  </span>
                </div>
                {run.errors.length > 0 && (
                  <ul className="m-0 grid gap-1 pl-5 text-small text-text-muted">
                    {run.errors.map((error, index) => (
                      <li key={index}>
                        {error.source ? `${error.source}: ` : ""}
                        {error.message}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.troubledSources.length > 0 && (
        <section aria-labelledby="sources" className="grid gap-4">
          <h2 id="sources" className="m-0 font-display text-h2">
            Sources needing attention
          </h2>
          <ul className="m-0 grid list-none gap-3 p-0">
            {data.troubledSources.map((source) => (
              <li
                key={source.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4"
              >
                <div className="grid min-w-0 flex-1 gap-1">
                  <span className="font-display text-label">
                    {source.name}{" "}
                    <span className="text-text-muted">
                      {source.active
                        ? `failed ${source.failures} ${source.failures === 1 ? "run" : "runs"} in a row`
                        : "switched off after 5 failed runs"}
                    </span>
                  </span>
                  {source.lastError && (
                    <span className="text-small break-words text-text-muted">
                      {source.lastError}
                    </span>
                  )}
                </div>
                {!source.active && (
                  <form action={turnSourceOn}>
                    <input type="hidden" name="id" value={source.id} />
                    <Button type="submit" variant="secondary">
                      <Power aria-hidden className="size-4" />
                      Turn back on
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Shown while the admin page checks the session. */
export function AdminNewsLoading() {
  return (
    <div className="mx-auto grid max-w-lesson gap-4 px-4 py-10 sm:px-6">
      <p className="m-0 font-display text-h1 max-sm:text-[30px]/[38px]">News queue</p>
      <p role="status" className="m-0 text-text-muted">
        Loading…
      </p>
    </div>
  );
}
