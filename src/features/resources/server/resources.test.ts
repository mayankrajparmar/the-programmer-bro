import { describe, expect, it } from "vitest";
import { LEVELS } from "@/config/levels";
import { ResourcesFileSchema } from "../schema";
import { getResources } from "./resources";

describe("content/resources.json", () => {
  const resources = getResources();

  it("loads and resolves every paired lesson", () => {
    expect(resources.length).toBeGreaterThan(0);
    for (const resource of resources.filter((r) => r.lesson)) {
      expect(resource.lesson?.href, resource.id).toMatch(/^\/learn\/[a-z-]+\/[a-z-]+$/);
    }
  });

  it("covers every level", () => {
    for (const level of LEVELS) {
      expect(
        resources.some((resource) => resource.level === level),
        level,
      ).toBe(true);
    }
  });

  it("lists the easiest resources first", () => {
    const order = resources.map((resource) => LEVELS.indexOf(resource.level));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe("resource rules", () => {
  const resource = {
    id: "x",
    title: "X",
    url: "https://example.com/",
    type: "Tool",
    level: "Beginner",
    cost: "Free",
    description: "A description that is long enough to say something useful.",
  };

  it("accepts a well-formed resource", () => {
    expect(ResourcesFileSchema.safeParse({ resources: [resource] }).success).toBe(true);
  });

  it("only links over https", () => {
    const http = { ...resource, url: "http://example.com/" };
    expect(ResourcesFileSchema.safeParse({ resources: [http] }).success).toBe(false);
  });

  it("rejects duplicate ids and unknown types", () => {
    expect(ResourcesFileSchema.safeParse({ resources: [resource, resource] }).success).toBe(false);
    const podcast = { ...resource, type: "Podcast" };
    expect(ResourcesFileSchema.safeParse({ resources: [podcast] }).success).toBe(false);
  });
});
