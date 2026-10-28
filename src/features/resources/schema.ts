import { z } from "zod";
import { LEVELS } from "@/config/levels";
import { RESOURCE_TYPES, type ResourceType } from "./types";

/** content/resources.json: the hand-picked list on /resources. Validated at build. */

export { RESOURCE_TYPES, type ResourceType };

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase words joined by hyphens");

export const ResourceSchema = z
  .object({
    id: slug,
    title: z.string().min(1),
    url: z.url({ protocol: /^https$/ }),
    type: z.enum(RESOURCE_TYPES),
    level: z.enum(LEVELS),
    /** e.g. "Free", "Free tier", "Free online". */
    cost: z.string().min(1),
    /** Only when it's known: "About 1 hour", "21 lessons", "Self-paced". */
    length: z.string().min(1).optional(),
    /** One or two sentences in our own words: what it is and why it's worth the time. */
    description: z.string().min(40).max(240),
    /** The lesson it pairs with, by slug. */
    lesson: slug.optional(),
  })
  .strict();

export const ResourcesFileSchema = z
  .object({
    $comment: z.string().optional(),
    resources: z.array(ResourceSchema).min(1),
  })
  .strict()
  .superRefine((file, ctx) => {
    const ids = file.resources.map((resource) => resource.id);
    for (const id of new Set(ids.filter((value, i) => ids.indexOf(value) !== i))) {
      ctx.addIssue({ code: "custom", message: `Resource id "${id}" is used twice` });
    }
  });

export type Resource = z.infer<typeof ResourceSchema>;
