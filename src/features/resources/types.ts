/** Resource kinds, in the order the filters list them. Kept free of zod so client code can import it. */
export const RESOURCE_TYPES = ["Course", "Video course", "Paper", "Tool", "Book"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];
