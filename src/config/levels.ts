/** Difficulty levels shared by tracks, lessons and resources, from easiest to hardest. */
export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
export type Level = (typeof LEVELS)[number];
