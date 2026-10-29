// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { site } from "@/config/site";
import { ComingSoonPage } from "./coming-soon-page";

afterEach(cleanup);

// The coming-soon page is only served with SITE_MODE=coming-soon (for maintenance), so it's
// checked here rather than in the browser tests.
describe("ComingSoonPage", () => {
  it("shows the headline, the launch note and a link to each social profile", () => {
    render(<ComingSoonPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Learn how AI really works");
    expect(screen.getByText(/Launching soon\./)).toBeTruthy();
    const follow = screen.getByRole("navigation", { name: "Follow along as we build it" });
    expect(within(follow).getAllByRole("link")).toHaveLength(site.social.length);
  });
});
