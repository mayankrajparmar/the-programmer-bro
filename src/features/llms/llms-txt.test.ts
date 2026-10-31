import { describe, expect, it } from "vitest";
import { getPublishedLessons } from "@/features/learn";
import { llmsFullTxt, llmsTxt } from "./llms-txt";

describe("llms.txt", () => {
  // Tests run as a preview build, where drafts are visible; llms.txt must still skip them.
  const lessons = getPublishedLessons().filter((lesson) => !lesson.draft);
  const drafts = getPublishedLessons().filter((lesson) => lesson.draft);

  it("starts with the site name and summary, then links every lesson", () => {
    const text = llmsTxt();
    expect(text.startsWith("# The Programmer Bro\n\n> ")).toBe(true);
    for (const lesson of lessons) {
      expect(text).toContain(`(https://theprogrammerbro.in${lesson.href})`);
    }
    expect(text).toContain("https://theprogrammerbro.in/llms-full.txt");
    for (const draft of drafts) expect(text).not.toContain(draft.href);
  });

  it("has the full text of every lesson in llms-full.txt", () => {
    const text = llmsFullTxt();
    for (const lesson of lessons) expect(text).toContain(`# ${lesson.title}\n`);
    for (const draft of drafts) expect(text).not.toContain(`# ${draft.title}\n`);
    expect(text).not.toMatch(/<(Analogy|Callout|Figure|TryIt|KeyTakeaways)/);
  });
});
