// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, DEFAULT_THEME, isTheme, THEME_STORAGE_KEY, themeInitScript } from "./theme";

const runInitScript = () => new Function(themeInitScript)();

afterEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = DEFAULT_THEME;
});

describe("theme", () => {
  it("defaults to dark", () => {
    expect(DEFAULT_THEME).toBe("dark");
  });

  it("recognises only the two themes", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("light")).toBe(true);
    expect(isTheme("sepia")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("applies a saved theme before paint", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("ignores an unknown saved value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "<script>");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("survives blocked storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(runInitScript).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("applyTheme sets the attribute and remembers the choice", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});
