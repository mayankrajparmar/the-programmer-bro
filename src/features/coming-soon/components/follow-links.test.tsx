// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FollowLinks } from "./follow-links";

afterEach(cleanup);

describe("FollowLinks", () => {
  it("renders nothing until profiles are configured", () => {
    const { container } = render(<FollowLinks links={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("links to each profile in a new tab, and says so", () => {
    render(
      <FollowLinks
        links={[
          { label: "LinkedIn", href: "https://www.linkedin.com/company/example" },
          { label: "YouTube", href: "https://www.youtube.com/@example" },
        ]}
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Follow along as we build it" });
    expect(nav).toBeTruthy();

    const link = screen.getByRole("link", { name: "LinkedIn (opens in a new tab)" });
    expect(link.getAttribute("href")).toBe("https://www.linkedin.com/company/example");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
