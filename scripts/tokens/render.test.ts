import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RADII, TYPE_STYLES } from "../../src/lib/utils";
import { contrastRatio } from "./contrast";
import { FONT_VARIABLES, fontStack, renderTokensCss, type DesignTokens } from "./render";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path: string) => readFileSync(`${root}${path}`, "utf8");
const tokens = JSON.parse(read("design/tokens.json")) as DesignTokens;

const THEMES = ["dark", "light"] as const;

function color(name: string, theme: (typeof THEMES)[number]): string {
  const token = tokens.color.tokens.find((t) => t.name === name);
  if (!token) throw new Error(`No colour token "${name}"`);
  return typeof token.value === "string" ? token.value : token.value[theme];
}

describe("generated token CSS", () => {
  it("is up to date with design/tokens.json", () => {
    expect(read("src/styles/tokens.css")).toBe(renderTokensCss(tokens));
  });

  it("defines every colour for both themes", () => {
    const css = renderTokensCss(tokens);
    for (const token of tokens.color.tokens) {
      expect(css.match(new RegExp(`--${token.name}: `, "g"))).toHaveLength(2);
      expect(css).toContain(`--color-${token.name}: var(--${token.name});`);
    }
  });

  it("swaps the first family in a stack for its next/font variable", () => {
    expect(fontStack('"Source Sans 3", system-ui, sans-serif')).toBe(
      "var(--font-source-sans), system-ui, sans-serif",
    );
    expect(() => fontStack("Comic Sans, cursive")).toThrow(/Comic Sans/);
  });
});

describe("fonts", () => {
  const fontsModule = read("src/styles/fonts.ts");

  it.each(tokens.type.fonts)("self-hosts $family $weight $style", (font) => {
    const file = font.file.replace(/^fonts\//, "");
    expect(existsSync(`${root}src/styles/fonts/${file}`)).toBe(true);
    expect(fontsModule).toContain(
      `{ path: "./fonts/${file}", weight: "${font.weight}", style: "${font.style}" }`,
    );
  });

  it("exposes a CSS variable for every family", () => {
    for (const variable of Object.values(FONT_VARIABLES)) {
      expect(fontsModule).toContain(`variable: "${variable}"`);
    }
  });
});

describe("class-name merging", () => {
  it("knows every type style and radius in the design system", () => {
    const styles = tokens.type.groups.flatMap((group) => group.styles.map((style) => style.name));
    expect([...TYPE_STYLES].sort()).toEqual(styles.sort());
    expect([...RADII].sort()).toEqual(
      tokens.radius.tokens.map((t) => t.name.replace(/^radius-/, "")).sort(),
    );
  });
});

/*
 * The contrast promises written in each token's usage note. If a colour changes
 * in the design system and breaks one, this fails before it ships.
 */
const SURFACES = ["bg", "surface", "surface-raised", "surface-code"];
const PROMISES: { fg: string; on: string[]; min: number }[] = [
  {
    fg: "text",
    on: [...SURFACES, "amber-subtle", "success-subtle", "danger-subtle", "info-subtle"],
    min: 14,
  },
  { fg: "text-muted", on: [...SURFACES, "amber-subtle"], min: 6.3 },
  { fg: "accent-text", on: [...SURFACES, "amber-subtle"], min: 5.6 },
  { fg: "focus-ring", on: SURFACES, min: 5.6 },
  { fg: "on-amber", on: ["amber", "amber-hover"], min: 10 },
  { fg: "border-strong", on: ["bg", "surface", "surface-raised"], min: 3 },
  { fg: "success", on: ["surface", "success-subtle"], min: 4.5 },
  { fg: "danger", on: ["surface", "danger-subtle"], min: 4.5 },
  { fg: "info", on: ["info-subtle"], min: 5.9 },
];

describe("colour contrast", () => {
  const cases = PROMISES.flatMap(({ fg, on, min }) =>
    THEMES.flatMap((theme) => on.map((bg) => ({ fg, bg, min, theme }))),
  );

  it.each(cases)("$fg on $bg ($theme) is at least $min:1", ({ fg, bg, min, theme }) => {
    expect(contrastRatio(color(fg, theme), color(bg, theme))).toBeGreaterThanOrEqual(min);
  });
});
