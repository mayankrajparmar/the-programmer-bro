import { describe, expect, it } from "vitest";
import { emptyMessage, filterResources } from "./filter";

const items = [
  { id: "a", level: "Beginner", type: "Course" },
  { id: "b", level: "Beginner", type: "Tool" },
  { id: "c", level: "Advanced", type: "Paper" },
] as const;

describe("filterResources", () => {
  it("shows everything with no filters", () => {
    expect(filterResources(items, { level: null, type: null })).toHaveLength(3);
  });

  it("filters by level, type, or both", () => {
    expect(filterResources(items, { level: "Beginner", type: null }).map((i) => i.id)).toEqual([
      "a",
      "b",
    ]);
    expect(filterResources(items, { level: null, type: "Paper" }).map((i) => i.id)).toEqual(["c"]);
    expect(filterResources(items, { level: "Advanced", type: "Tool" })).toEqual([]);
  });
});

describe("emptyMessage", () => {
  it("names what's missing", () => {
    expect(emptyMessage({ level: "Expert", type: "Paper" })).toBe("No expert papers yet.");
    expect(emptyMessage({ level: null, type: "Video course" })).toBe("No video courses yet.");
    expect(emptyMessage({ level: "Advanced", type: null })).toBe("No advanced resources yet.");
  });
});
