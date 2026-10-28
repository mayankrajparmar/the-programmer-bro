import { describe, expect, it } from "vitest";
import { buttonVariants } from "./button";

describe("buttonVariants", () => {
  it("gives each variant exactly one border colour", () => {
    for (const variant of ["primary", "secondary", "ghost"] as const) {
      const borders = buttonVariants({ variant })
        .split(" ")
        .filter((c) => /^border-(?![0-9]|[xytblrse]-|[xytblrse]$)/.test(c)); // colours, not widths
      expect(borders, variant).toHaveLength(1);
    }
  });

  it("lets a caller's class override the variant's", () => {
    const classes = buttonVariants({ variant: "secondary" }, "bg-bg px-5").split(" ");
    expect(classes).toContain("bg-bg");
    expect(classes).not.toContain("bg-transparent");
    expect(classes).toContain("px-5");
    expect(classes).not.toContain("px-4");
  });
});
