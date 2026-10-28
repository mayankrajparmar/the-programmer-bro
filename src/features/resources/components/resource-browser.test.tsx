// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResourceView } from "../server/resources";
import { ResourceBrowser } from "./resource-browser";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const resource = (id: string, level: ResourceView["level"], type: ResourceView["type"]) => ({
  id,
  title: `Title ${id}`,
  url: `https://example.com/${id}`,
  type,
  level,
  cost: "Free",
  description: "A description that is long enough to say something useful.",
  lesson: null,
});

const resources: ResourceView[] = [
  resource("a", "Beginner", "Course"),
  resource("b", "Beginner", "Tool"),
  resource("c", "Advanced", "Paper"),
];

afterEach(cleanup);

describe("ResourceBrowser", () => {
  it("filters with the chips and says how many are shown", () => {
    render(<ResourceBrowser resources={resources} />);
    expect(screen.getAllByRole("article")).toHaveLength(3);

    const beginner = screen.getByRole("button", { name: "Beginner" });
    fireEvent.click(beginner);
    expect(beginner.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("status").textContent).toBe("Showing 2 of 3 resources");
  });

  it("shows an empty state that clears the filters", () => {
    render(<ResourceBrowser resources={resources} />);
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    fireEvent.click(screen.getByRole("button", { name: "Tool" }));
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "No advanced tools yet." })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Show all resources/ }));
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("names each link with the resource, its level and type", () => {
    render(<ResourceBrowser resources={resources} />);
    expect(
      screen.getByRole("link", { name: "Open Title c, an advanced paper (opens in a new tab)" }),
    ).toBeTruthy();
  });
});
