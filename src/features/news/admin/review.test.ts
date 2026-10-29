import { describe, expect, it } from "vitest";
import { parseReview, reviewUpdate } from "./review";

const ID = "6f1c2c9e-8d0b-4b8a-9a52-1c3f0f6b2d11";
const SUMMARY =
  "An AI lab has released an open model that reads very long prompts on a single graphics card.";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const complete = {
  id: ID,
  intent: "approve",
  title: "An open model that reads long prompts on one GPU",
  summary: SUMMARY,
  tag: "models",
};

describe("parseReview", () => {
  it("accepts a complete story for approval, trimming text", () => {
    const result = parseReview(form({ ...complete, title: `  ${complete.title}  ` }));
    expect(result).toEqual({
      ok: true,
      review: { id: ID, intent: "approve", title: complete.title, summary: SUMMARY, tag: "models" },
    });
  });

  it("won't approve without a real summary or a topic", () => {
    expect(parseReview(form({ ...complete, summary: "Too short." }))).toEqual({
      ok: false,
      message: "Write a summary of at least 12 words before approving.",
    });
    expect(parseReview(form({ ...complete, tag: "" }))).toEqual({
      ok: false,
      message: "Pick a topic before approving.",
    });
  });

  it("saves drafts with blanks as nulls", () => {
    const result = parseReview(form({ ...complete, intent: "save", summary: "  ", tag: "" }));
    expect(result).toMatchObject({ ok: true, review: { summary: null, tag: null } });
  });

  it("rejects whatever is in the form", () => {
    expect(parseReview(form({ id: ID, intent: "reject", title: "" }))).toMatchObject({ ok: true });
  });

  it("refuses unknown stories, actions and topics", () => {
    expect(parseReview(form({ ...complete, id: "1; drop table" }))).toEqual({
      ok: false,
      message: "Unknown story.",
    });
    expect(parseReview(form({ ...complete, intent: "publish" }))).toEqual({
      ok: false,
      message: "Unknown action.",
    });
    expect(parseReview(form({ ...complete, tag: "gossip" })).ok).toBe(false);
    expect(parseReview(form({ ...complete, title: "Short" }))).toEqual({
      ok: false,
      message: "The headline needs at least 10 characters.",
    });
  });
});

describe("reviewUpdate", () => {
  const now = new Date("2026-10-29T06:00:00Z");
  const review = { id: ID, title: "Headline here", summary: SUMMARY, tag: "models" as const };

  it("publishes with a timestamp", () => {
    expect(reviewUpdate({ ...review, intent: "approve" }, now)).toEqual({
      title: "Headline here",
      summary: SUMMARY,
      tag: "models",
      status: "approved",
      approved_at: "2026-10-29T06:00:00.000Z",
      updated_at: "2026-10-29T06:00:00.000Z",
    });
  });

  it("rejects, taking a live story down", () => {
    expect(reviewUpdate({ ...review, intent: "reject" }, now)).toEqual({
      status: "rejected",
      approved_at: null,
      updated_at: "2026-10-29T06:00:00.000Z",
    });
  });

  it("saves edits without changing the status", () => {
    expect(reviewUpdate({ ...review, intent: "save" }, now)).not.toHaveProperty("status");
  });
});
