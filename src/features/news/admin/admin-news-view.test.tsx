// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminNewsData, StoryForReview } from "./queries";

vi.mock("./actions", () => ({
  reviewStory: vi.fn(async () => ({ status: "idle" })),
  turnSourceOn: vi.fn(async () => {}),
}));
vi.mock("@/features/auth", () => ({ requireAdmin: vi.fn(), signOut: vi.fn() }));

const { AdminNewsView } = await import("./admin-news-page");

afterEach(cleanup);

const story = (overrides: Partial<StoryForReview> = {}): StoryForReview => ({
  id: "6f1c2c9e-8d0b-4b8a-9a52-1c3f0f6b2d11",
  status: "draft",
  title: "An open model that reads long prompts on one GPU",
  sourceTitle: "Introducing Lumen 2, a smaller open model",
  summary: "An AI lab has released an open model that reads very long prompts.",
  tag: "models",
  url: "https://lab.example.com/lumen-2",
  sourceName: "Example Lab",
  publishedAt: "2026-10-29T03:00:00Z",
  ...overrides,
});

const data = (overrides: Partial<AdminNewsData> = {}): AdminNewsData => ({
  configured: true,
  error: null,
  drafts: [story()],
  live: [],
  runs: [],
  troubledSources: [],
  ...overrides,
});

describe("AdminNewsView", () => {
  it("shows each draft as a labelled form with approve, save and reject", () => {
    render(<AdminNewsView email="me@example.com" data={data()} />);
    expect(screen.getByRole("heading", { level: 1, name: "News queue" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Drafts (1)" })).toBeTruthy();
    const card = screen.getByRole("article");
    expect((within(card).getByLabelText("Headline") as HTMLInputElement).value).toBe(story().title);
    expect((within(card).getByLabelText("Topic") as HTMLSelectElement).value).toBe("models");
    for (const name of ["Approve", "Save draft", "Reject"]) {
      expect(within(card).getByRole("button", { name })).toBeTruthy();
    }
    expect(within(card).getByText("Source headline: Introducing Lumen 2, a smaller open model"));
  });

  it("counts summary words as you type", () => {
    render(<AdminNewsView email={null} data={data()} />);
    const summary = screen.getByLabelText("Summary");
    fireEvent.change(summary, { target: { value: "Three short words" } });
    expect(screen.getByText(/^3 words\./)).toBeTruthy();
  });

  it("flags drafts the summariser couldn't write", () => {
    render(
      <AdminNewsView email={null} data={data({ drafts: [story({ summary: null, tag: null })] })} />,
    );
    expect(screen.getByText(/Write a summary before approving/)).toBeTruthy();
  });

  it("shows job runs with their problems, and sources that were switched off", () => {
    render(
      <AdminNewsView
        email={null}
        data={data({
          drafts: [],
          runs: [
            {
              id: "r1",
              status: "partial",
              startedAt: "2026-10-29T04:07:00Z",
              finishedAt: "2026-10-29T04:08:00Z",
              fetched: 74,
              fresh: 12,
              saved: 12,
              errors: [{ source: "Mistral AI", stage: "fetch", message: "HTTP 404" }],
            },
          ],
          troubledSources: [
            {
              id: "00000000-0000-4000-8000-0000000000aa",
              name: "Mistral AI",
              url: "https://mistral.ai/news/rss",
              active: false,
              failures: 5,
              lastError: "HTTP 404",
            },
          ],
        })}
      />,
    );
    expect(screen.getByText(/No drafts waiting/)).toBeTruthy();
    expect(screen.getByText("Partly OK")).toBeTruthy();
    expect(screen.getByText("Mistral AI: HTTP 404")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Turn back on" })).toBeTruthy();
  });
});
