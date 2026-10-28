import localFont from "next/font/local";

/*
 * The design system's three families, self-hosted (SIL Open Font License, see
 * src/styles/fonts/OFL.txt). The CSS variables are mapped to Tailwind's font-display,
 * font-body and font-mono in src/styles/tokens.css (generated).
 */

export const montserrat = localFont({
  src: [
    { path: "./fonts/montserrat-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/montserrat-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/montserrat-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/montserrat-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

export const sourceSans = localFont({
  src: [
    { path: "./fonts/source-sans-3-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/source-sans-3-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/source-sans-3-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-source-sans",
  display: "swap",
});

export const jetbrainsMono = localFont({
  src: [{ path: "./fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--font-jetbrains-mono",
  display: "swap",
  // Code is rarely above the fold, so don't compete with the heading fonts.
  preload: false,
});

export const fontVariables = [
  montserrat.variable,
  sourceSans.variable,
  jetbrainsMono.variable,
].join(" ");
