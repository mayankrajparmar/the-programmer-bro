import { ContentPage, pageMetadata } from "@/features/pages";

export const metadata = pageMetadata("about");

/* Built once from content/pages/about.mdx. */
export const ensureStatic = "navigation";

export default function Page() {
  return <ContentPage slug="about" />;
}
