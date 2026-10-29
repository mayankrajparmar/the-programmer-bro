import { Card, CardBody, CardFooter, CardLink, CardMeta, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { TOPIC_LABELS } from "../topics";
import type { NewsView } from "../view";

/** One story: topic and date, our headline and summary, and a link to the source. */
export function NewsCard({ story }: { story: NewsView }) {
  return (
    <Card interactive className="flex h-full flex-col">
      <CardMeta>
        <Tag tone={story.tag}>{TOPIC_LABELS[story.tag]}</Tag>
        <time dateTime={story.publishedAt}>{story.date}</time>
      </CardMeta>
      <CardTitle as="h3">{story.title}</CardTitle>
      <CardBody>{story.summary}</CardBody>
      <CardFooter className="mt-auto flex-wrap gap-y-1">
        <span>Source: {story.sourceName}</span>
        <CardLink href={story.url} label={`Read source: ${story.title}`} stretch>
          Read source
        </CardLink>
      </CardFooter>
    </Card>
  );
}
