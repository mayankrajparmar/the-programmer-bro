/**
 * Turns design/tokens.json (exported from The Programmer Bro design system) into
 * src/styles/tokens.css: the CSS variables for both themes, plus the Tailwind theme
 * that maps utilities such as `bg-surface` and `text-h1` onto them.
 *
 * Pure function, so the unit tests can check that the committed CSS is current.
 */

type Themed = string | { dark: string; light: string };

interface Token<V = string> {
  name: string;
  value: V;
  usage?: string;
}

interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

export interface DesignTokens {
  name: string;
  version: number;
  color: { tokens: Token<Themed>[] };
  type: {
    fonts: { family: string; file: string; weight: string; style: string }[];
    families: Record<"display" | "body" | "mono", string>;
    groups: { name: string; family: string; styles: TypeStyle[] }[];
  };
  spacing: { tokens: Token[] };
  radius: { tokens: Token[] };
  shadow: { tokens: Token<Themed>[] };
  layout: { tokens: Token[] };
}

/** next/font exposes each self-hosted family as a CSS variable (see src/styles/fonts.ts). */
export const FONT_VARIABLES: Record<string, string> = {
  Montserrat: "--font-montserrat",
  "Source Sans 3": "--font-source-sans",
  "JetBrains Mono": "--font-jetbrains-mono",
};

/** Layout tokens that become Tailwind `max-w-*` sizes. */
const CONTAINERS: Record<string, string> = {
  "measure-lesson": "lesson",
  "page-max": "page",
};

const themed = (value: Themed, theme: "dark" | "light") =>
  typeof value === "string" ? value : value[theme];

/** Swaps the first family in a stack for its next/font variable. */
export function fontStack(stack: string): string {
  const [first = "", ...rest] = stack.split(",").map((part) => part.trim());
  const family = first.replace(/^["']|["']$/g, "");
  const variable = FONT_VARIABLES[family];
  if (!variable) throw new Error(`No next/font variable for font family "${family}"`);
  return [`var(${variable})`, ...rest].join(", ");
}

export function renderTokensCss(tokens: DesignTokens): string {
  const colors = tokens.color.tokens;
  const shadows = tokens.shadow.tokens;
  const plain = [...tokens.spacing.tokens, ...tokens.radius.tokens, ...tokens.layout.tokens];

  const themeBlock = (theme: "dark" | "light") =>
    [
      ...colors.map((t) => `  --${t.name}: ${themed(t.value, theme)};`),
      ...shadows.map((t) => `  --${t.name}: ${themed(t.value, theme)};`),
      `  color-scheme: ${theme};`,
    ].join("\n");

  const typeStyles = tokens.type.groups.flatMap((group) => group.styles);

  const tailwind = [
    "  /* Only design-system colours, sizes and fonts: Tailwind's defaults are switched off. */",
    "  --color-*: initial;",
    "  --text-*: initial;",
    "  --font-*: initial;",
    "  --radius-*: initial;",
    "",
    ...colors.map((t) => `  --color-${t.name}: var(--${t.name});`),
    "",
    `  --font-display: ${fontStack(tokens.type.families.display)};`,
    `  --font-body: ${fontStack(tokens.type.families.body)};`,
    `  --font-mono: ${fontStack(tokens.type.families.mono)};`,
    `  --default-font-family: ${fontStack(tokens.type.families.body)};`,
    `  --default-mono-font-family: ${fontStack(tokens.type.families.mono)};`,
    "",
    ...typeStyles.flatMap((s) => [
      `  --text-${s.name}: ${s.fontSize};`,
      `  --text-${s.name}--line-height: ${s.lineHeight};`,
      `  --text-${s.name}--font-weight: ${s.fontWeight};`,
      ...(s.letterSpacing ? [`  --text-${s.name}--letter-spacing: ${s.letterSpacing};`] : []),
    ]),
    "",
    ...tokens.radius.tokens.map((t) => `  --${t.name}: ${t.value};`),
    "",
    ...tokens.layout.tokens
      .filter((t) => CONTAINERS[t.name])
      .map((t) => `  --container-${CONTAINERS[t.name]}: ${t.value};`),
  ].join("\n");

  return `/*
 * Generated from design/tokens.json by \`npm run tokens\`. Do not edit by hand:
 * change the design system, export tokens.json again, then run the script.
 * ${tokens.name} design tokens, version ${tokens.version}.
 */

/* Dark is the default theme, matching the logo. */
:root,
[data-theme="dark"] {
${themeBlock("dark")}
}

[data-theme="light"] {
${themeBlock("light")}
}

:root {
${plain.map((t) => `  --${t.name}: ${t.value};`).join("\n")}
}

@theme inline {
${tailwind}
}
`;
}
