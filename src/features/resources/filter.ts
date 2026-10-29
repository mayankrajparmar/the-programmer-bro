import type { Level } from "@/config/levels";
import type { ResourceType } from "./types";

export interface ResourceFilters {
  level: Level | null;
  type: ResourceType | null;
}

/** Keeps the resources matching the chosen level and type; null means "All". */
export function filterResources<T extends { level: Level; type: ResourceType }>(
  resources: readonly T[],
  { level, type }: ResourceFilters,
): T[] {
  return resources.filter(
    (resource) => (!level || resource.level === level) && (!type || resource.type === type),
  );
}

/** "No expert papers yet." style empty-state wording. */
export function emptyMessage({ level, type }: ResourceFilters): string {
  const plural: Record<ResourceType, string> = {
    Course: "courses",
    "Video course": "video courses",
    Paper: "papers",
    Tool: "tools",
    Book: "books",
  };
  const what = type ? plural[type] : "resources";
  return `No ${level ? `${level.toLowerCase()} ` : ""}${what} yet.`;
}
