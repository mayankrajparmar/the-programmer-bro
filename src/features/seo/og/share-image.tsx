import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";

/*
 * Share cards (Open Graph images) for lessons and tracks, in the style of the
 * site-wide card in src/app/opengraph-image.png: the amber logo, a big headline on
 * the dark background and the site's address. Colours come from design/tokens.json
 * (dark theme); fonts are TTF copies of the self-hosted WOFF2 files, because the
 * image renderer can't read WOFF2 (SIL Open Font License, see og/fonts/OFL.txt).
 */

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

const ROOT = process.cwd();
const FONT_DIR = path.join(ROOT, "src", "features", "seo", "og", "fonts");

interface Token {
  name: string;
  value: string | { dark: string; light: string };
}

async function darkColours() {
  const file = JSON.parse(await readFile(path.join(ROOT, "design", "tokens.json"), "utf8")) as {
    color: { tokens: Token[] };
  };
  const colour = (name: string) => {
    const token = file.color.tokens.find((entry) => entry.name === name);
    if (!token) throw new Error(`design/tokens.json has no colour "${name}"`);
    return typeof token.value === "string" ? token.value : token.value.dark;
  };
  return {
    bg: colour("bg"),
    border: colour("border"),
    borderStrong: colour("border-strong"),
    text: colour("text"),
    muted: colour("text-muted"),
    amber: colour("amber"),
  };
}

async function svgDataUri(file: string) {
  const svg = await readFile(path.join(ROOT, "public", "brand", file));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

async function fonts() {
  const load = (name: string) => readFile(path.join(FONT_DIR, `${name}.ttf`));
  const [heading, headingBold, body, bodyStrong] = await Promise.all([
    load("montserrat-latin-700-normal"),
    load("montserrat-latin-800-normal"),
    load("source-sans-3-latin-400-normal"),
    load("source-sans-3-latin-600-normal"),
  ]);
  return [
    { name: "Montserrat", data: heading, weight: 700 as const, style: "normal" as const },
    { name: "Montserrat", data: headingBold, weight: 800 as const, style: "normal" as const },
    { name: "Source Sans", data: body, weight: 400 as const, style: "normal" as const },
    { name: "Source Sans", data: bodyStrong, weight: 600 as const, style: "normal" as const },
  ];
}

export interface ShareCard {
  /** Small amber line above the title, e.g. "How AI Works · Lesson 2 of 16". */
  eyebrow: string;
  title: string;
  /** One short line under the title. */
  summary?: string;
  /** Short facts shown as chips, e.g. "Free", "10 min read". */
  chips: readonly string[];
}

export async function renderShareImage({ eyebrow, title, summary, chips }: ShareCard) {
  const [colours, fontList, logo, wordmark] = await Promise.all([
    darkColours(),
    fonts(),
    svgDataUri("pb-logo-amber.svg"),
    svgDataUri("wordmark-amber.svg"),
  ]);
  const titleSize = title.length > 44 ? 64 : 76;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 80px",
        backgroundColor: colours.bg,
        backgroundImage: `radial-gradient(circle at 2px 2px, ${colours.border} 2px, transparent 0)`,
        backgroundSize: "28px 28px",
        color: colours.text,
        fontFamily: "Source Sans",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG, not a page */}
        <img src={logo} width={104} height={73} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG, not a page */}
        <img src={wordmark} width={176} height={72} alt="" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Montserrat",
            fontWeight: 700,
            fontSize: 28,
            color: colours.amber,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Montserrat",
            fontWeight: 800,
            fontSize: titleSize,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>
        {summary && (
          <div style={{ display: "flex", fontSize: 34, color: colours.muted }}>{summary}</div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {chips.map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                padding: "8px 18px",
                border: `2px solid ${colours.borderStrong}`,
                borderRadius: 10,
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Montserrat",
            fontWeight: 700,
            fontSize: 30,
            color: colours.amber,
          }}
        >
          {new URL(site.url).host}
        </div>
      </div>
    </div>,
    { ...SHARE_IMAGE_SIZE, fonts: fontList },
  );
}
