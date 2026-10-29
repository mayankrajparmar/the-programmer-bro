import type { Metadata, Viewport } from "next";
import { allowIndexing, site } from "@/config/site";
import { isLive } from "@/config/site-mode";
import { DEFAULT_THEME, themeInitScript } from "@/lib/theme";
import { fontVariables } from "@/styles/fonts";
import "@/styles/globals.css";

const title = `${site.name}: ${site.tagline}`;
const description = isLive ? site.description : `${site.description} Launching soon.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s · ${site.name}`,
  },
  description,
  applicationName: site.name,
  authors: [{ name: site.author.name, url: site.author.url }],
  creator: site.author.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: "/",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      data-theme={DEFAULT_THEME}
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        {/* Applies a saved light/dark choice before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
