// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

afterEach(cleanup);

describe("MainNav", () => {
  it("marks the current section, including pages inside it", () => {
    pathname.current = "/news/some-story";
    render(<MainNav />);
    expect(screen.getByRole("link", { name: "AI News" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Learn" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/learn",
      "/news",
      "/resources",
    ]);
  });
});

describe("MobileNav", () => {
  it("opens and closes the menu sheet", () => {
    pathname.current = "/learn";
    render(<MobileNav />);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link", { name: "Learn" })).toBeNull(); // hidden sheet

    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Learn" }).getAttribute("aria-current")).toBe("page");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("closes when you tap outside it", () => {
    render(<MobileNav />);
    const button = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(button);
    fireEvent.pointerDown(document.body);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
});
