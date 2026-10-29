import {
  BookOpen,
  FileText,
  GraduationCap,
  MonitorPlay,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, CardBody, CardLink, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import type { ResourceType } from "../types";
import type { ResourceView } from "../server/resources";

const TYPE_ICONS: Record<ResourceType, LucideIcon> = {
  Course: GraduationCap,
  "Video course": MonitorPlay,
  Paper: FileText,
  Tool: Wrench,
  Book: BookOpen,
};

const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

/** One resource: what it is, why it's worth the time, the lesson it pairs with, and a link out. */
export function ResourceCard({ resource }: { resource: ResourceView }) {
  const Icon = TYPE_ICONS[resource.type];
  const level = resource.level.toLowerCase();
  const kind = resource.type.toLowerCase();

  return (
    <Card interactive className="flex h-full flex-col">
      <span className="inline-flex items-center gap-2 font-display text-label text-text-muted">
        <Icon aria-hidden className="size-4" />
        {resource.type}
      </span>
      <CardTitle as="h2">{resource.title}</CardTitle>
      <CardBody>{resource.description}</CardBody>
      {resource.lesson && (
        <p className="m-0 text-small text-text-muted">
          Pairs with{" "}
          {resource.lesson.published ? (
            <Link
              href={resource.lesson.href}
              className="relative z-10 text-accent-text underline underline-offset-[3px] hover:text-text"
            >
              lesson {resource.lesson.number}, {resource.lesson.title}
            </Link>
          ) : (
            <>
              lesson {resource.lesson.number}, {resource.lesson.title} (coming soon)
            </>
          )}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 text-small">
        <Tag>{resource.level}</Tag>
        <span>{resource.cost}</span>
        {resource.length && (
          <>
            <span aria-hidden="true" className="text-text-muted">
              ·
            </span>
            <span className="text-text-muted">{resource.length}</span>
          </>
        )}
        <CardLink
          href={resource.url}
          label={`Open ${resource.title}, ${article(level)} ${level} ${kind}`}
          stretch
          className="ml-auto"
        >
          Open
        </CardLink>
      </div>
    </Card>
  );
}
