import "server-only";
import { cacheLife } from "next/cache";
import { createCssVariablesTheme, createHighlighter, type Highlighter } from "shiki";

/*
 * Build-time syntax highlighting with Shiki. The theme is CSS variables only, so
 * colours come from the design tokens (see .tpb-code in globals.css) and switch
 * with the light/dark theme for free. No highlighting code ships to the browser.
 */

export const CODE_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "json",
  "bash",
  "html",
  "css",
  "sql",
  "yaml",
  "markdown",
] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number] | "text";

const theme = createCssVariablesTheme({
  name: "tpb",
  variablePrefix: "--shiki-",
  variableDefaults: {},
  fontStyle: true,
});

let highlighter: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighter({ themes: [theme], langs: [...CODE_LANGUAGES] });
  return highlighter;
}

export function isCodeLanguage(value: string): value is CodeLanguage {
  return value === "text" || (CODE_LANGUAGES as readonly string[]).includes(value);
}

/** Highlighted HTML for a code sample: a <pre> with one coloured <span> per token. */
export async function highlight(code: string, lang: CodeLanguage): Promise<string> {
  "use cache";
  cacheLife("max"); // The same input always gives the same output.
  const shiki = await getHighlighter();
  return shiki.codeToHtml(code.replace(/\n$/, ""), { lang, theme: "tpb" });
}
