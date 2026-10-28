// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Callout } from "./callout";

afterEach(cleanup);

describe("Callout", () => {
  it.each([
    ["note", "Note"],
    ["tip", "Tip"],
    ["warn", "Watch out"],
    ["analogy", "Think of it like this"],
  ] as const)('titles a %s callout "%s" by default', (kind, title) => {
    render(<Callout kind={kind}>Body</Callout>);
    const aside = screen.getByRole("complementary");
    expect(aside.textContent).toContain(title);
    expect(aside.textContent).toContain("Body");
  });

  it("uses a custom title when given one", () => {
    render(
      <Callout kind="note" title="Did you know?">
        Body
      </Callout>,
    );
    expect(screen.getByText("Did you know?")).toBeTruthy();
    expect(screen.queryByText("Note")).toBeNull();
  });
});
