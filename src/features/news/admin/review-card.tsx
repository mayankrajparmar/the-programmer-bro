"use client";

import { ExternalLink } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, TextArea } from "@/components/ui/field";
import { Tag } from "@/components/ui/tag";
import { NEWS_TOPICS, TOPIC_LABELS } from "../topics";
import { reviewStory, type ReviewState } from "./actions";
import type { StoryForReview } from "./queries";
import { wordCount } from "./review";

/** One story to check: edit the headline, summary and topic, then approve, save or reject. */
export function ReviewCard({
  story,
  published,
  live = false,
}: {
  story: StoryForReview;
  /** When the source published it, already formatted. */
  published: string;
  /** A story that's already on the site: it can be edited or taken down. */
  live?: boolean;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewStory, {
    status: "idle",
  });
  const [summary, setSummary] = useState(story.summary ?? "");
  const words = wordCount(summary);
  const id = (field: string) => `${field}-${story.id}`;

  return (
    <Card as="article" className="gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-text-muted">
        {story.tag ? <Tag tone={story.tag}>{TOPIC_LABELS[story.tag]}</Tag> : <Tag>No topic</Tag>}
        <span>
          {story.sourceName} · {published}
        </span>
        <a
          href={story.url}
          target="_blank"
          rel="noopener"
          className="ml-auto inline-flex min-h-11 items-center gap-1 font-display text-label text-accent-text"
        >
          Open source
          <span className="sr-only">: {story.sourceTitle} (opens in a new tab)</span>
          <ExternalLink aria-hidden className="size-4" />
        </a>
      </div>

      {story.sourceTitle !== story.title && (
        <p className="m-0 text-small text-text-muted">Source headline: {story.sourceTitle}</p>
      )}
      {!story.summary && !live && (
        <p className="m-0 rounded-md bg-amber-subtle px-3 py-2 text-small text-text">
          The summariser couldn&apos;t write this one. Write a summary before approving.
        </p>
      )}

      <form action={action} className="grid gap-4">
        <input type="hidden" name="id" value={story.id} />
        <Field label="Headline" htmlFor={id("title")}>
          <Input
            id={id("title")}
            name="title"
            defaultValue={story.title}
            required
            maxLength={160}
          />
        </Field>
        <Field
          label="Summary"
          htmlFor={id("summary")}
          hint={`${words} ${words === 1 ? "word" : "words"}. Aim for 2 or 3 sentences, at most 60 words, in your own words.`}
        >
          <TextArea
            id={id("summary")}
            name="summary"
            rows={4}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={800}
          />
        </Field>
        <Field label="Topic" htmlFor={id("tag")} className="max-w-[240px]">
          <Select id={id("tag")} name="tag" defaultValue={story.tag ?? ""}>
            <option value="">Choose a topic</option>
            {NEWS_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {TOPIC_LABELS[topic]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          {live ? (
            <>
              <Button
                type="submit"
                name="intent"
                value="save"
                variant="secondary"
                disabled={pending}
              >
                Save changes
              </Button>
              <Button type="submit" name="intent" value="reject" variant="ghost" disabled={pending}>
                Take down
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" name="intent" value="approve" disabled={pending}>
                Approve
              </Button>
              <Button
                type="submit"
                name="intent"
                value="save"
                variant="secondary"
                disabled={pending}
              >
                Save draft
              </Button>
              <Button type="submit" name="intent" value="reject" variant="ghost" disabled={pending}>
                Reject
              </Button>
            </>
          )}
          {state.status === "error" && (
            <p role="alert" className="m-0 text-small text-danger">
              {state.message}
            </p>
          )}
          {state.status === "saved" && (
            <p role="status" className="m-0 text-small text-success">
              {state.message}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
