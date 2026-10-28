import { describe, expect, it, vi } from "vitest";
import { highlight, isCodeLanguage } from "./highlight";

// Outside Next.js, "use cache" is inert and cacheLife has nothing to configure.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

describe("highlight", () => {
  it("colours tokens with the CSS variables that globals.css maps to design tokens", async () => {
    const html = await highlight('# say hi\nprint("hi")\n', "python");
    expect(html).toMatch(/^<pre class="shiki tpb"/);
    expect(html).toContain("var(--shiki-token-comment)");
    expect(html).toContain("var(--shiki-token-string-expression)");
    expect(html).not.toMatch(/#[0-9a-f]{6}/i); // no hard-coded colours
  });

  it("leaves plain text alone", async () => {
    const html = await highlight("just text", "text");
    expect(html).toContain("just text");
  });

  it("knows which languages it supports", () => {
    expect(isCodeLanguage("python")).toBe(true);
    expect(isCodeLanguage("text")).toBe(true);
    expect(isCodeLanguage("cobol")).toBe(false);
  });
});
