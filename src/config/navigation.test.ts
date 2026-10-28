import { describe, expect, it } from "vitest";
import { isCurrentSection } from "./navigation";

describe("isCurrentSection", () => {
  it("matches the section and the pages inside it", () => {
    expect(isCurrentSection("/learn", "/learn")).toBe(true);
    expect(isCurrentSection("/learn/how-ai-works/tokens", "/learn")).toBe(true);
  });

  it("does not match lookalike paths or other sections", () => {
    expect(isCurrentSection("/learning", "/learn")).toBe(false);
    expect(isCurrentSection("/news", "/learn")).toBe(false);
    expect(isCurrentSection(null, "/learn")).toBe(false);
  });
});
