import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { LEVELS } from "@/config/levels";
import { getTracks } from "@/features/learn";
import { ResourcesFileSchema, type Resource } from "../schema";
import { RESOURCE_TYPES } from "../types";

const FILE = path.join(process.cwd(), "content", "resources.json");

export interface PairedLesson {
  number: number;
  title: string;
  href: string;
  published: boolean;
}

export interface ResourceView extends Omit<Resource, "lesson"> {
  lesson: PairedLesson | null;
}

/**
 * Every resource, easiest first, then by type, with its paired lesson resolved.
 * Throws (failing the build) if the file is invalid or names a lesson that isn't in a track plan.
 */
export function getResources(): ResourceView[] {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(FILE, "utf8"));
  } catch (error) {
    throw new Error(`content/resources.json: not valid JSON (${(error as Error).message})`);
  }
  const parsed = ResourcesFileSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(file)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`content/resources.json: ${issues}`);
  }

  const lessons = new Map(
    getTracks().flatMap((track) => track.lessons.map((lesson) => [lesson.slug, lesson] as const)),
  );

  return parsed.data.resources
    .map(({ lesson: slug, ...resource }) => {
      if (!slug) return { ...resource, lesson: null };
      const lesson = lessons.get(slug);
      if (!lesson) {
        throw new Error(
          `content/resources.json: "${resource.id}" pairs with lesson "${slug}", which isn't in any track plan`,
        );
      }
      return {
        ...resource,
        lesson: {
          number: lesson.number,
          title: lesson.title,
          href: lesson.href,
          published: lesson.published,
        },
      };
    })
    .sort(
      (a, b) =>
        LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) ||
        RESOURCE_TYPES.indexOf(a.type) - RESOURCE_TYPES.indexOf(b.type),
    );
}
