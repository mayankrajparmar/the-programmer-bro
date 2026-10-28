import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps a type style and a text colour together", () => {
    expect(cn("text-h1", "text-text-muted")).toBe("text-h1 text-text-muted");
  });

  it("lets a later type style or colour win", () => {
    expect(cn("text-h1", "text-body")).toBe("text-body");
    expect(cn("text-text", "text-text-muted")).toBe("text-text-muted");
  });

  it("resolves design-system radii", () => {
    expect(cn("rounded-md", "rounded-pill")).toBe("rounded-pill");
  });

  it("drops falsy values", () => {
    expect(cn("block", false, undefined, null, "")).toBe("block");
  });
});
