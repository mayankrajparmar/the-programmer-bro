import { ContentPage, pageMetadata } from "@/features/pages";

export const metadata = pageMetadata("privacy");

/* Built once from content/pages/privacy.mdx. */
export const ensureStatic = "navigation";

export default function Page() {
  return <ContentPage slug="privacy" />;
}
