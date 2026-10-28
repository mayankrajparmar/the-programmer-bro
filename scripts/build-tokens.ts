/**
 * Writes src/styles/tokens.css from design/tokens.json.
 *
 *   npm run tokens          regenerate the CSS
 *   npm run tokens:check    fail if the committed CSS is out of date (used in CI)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderTokensCss, type DesignTokens } from "./tokens/render.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = `${root}design/tokens.json`;
const target = `${root}src/styles/tokens.css`;

const tokens = JSON.parse(readFileSync(source, "utf8")) as DesignTokens;
const css = renderTokensCss(tokens);

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(target, "utf8");
  } catch {
    // Missing file counts as out of date.
  }
  if (current !== css) {
    console.error(
      "src/styles/tokens.css is out of date. Run `npm run tokens` and commit the result.",
    );
    process.exit(1);
  }
  console.log("src/styles/tokens.css is up to date.");
} else {
  writeFileSync(target, css);
  console.log(`Wrote ${target.replace(root, "")}`);
}
