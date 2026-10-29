import { ContentPage, pageMetadata } from "@/features/pages";

export const metadata = pageMetadata("ai-content");

/* Built once from content/pages/ai-content.mdx. */
export const ensureStatic = "navigation";

export default function Page() {
  return <ContentPage slug="ai-content" />;
}
