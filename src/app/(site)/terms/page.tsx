import { ContentPage, pageMetadata } from "@/features/pages";

export const metadata = pageMetadata("terms");

/* Built once from content/pages/terms.mdx. */
export const ensureStatic = "navigation";

export default function Page() {
  return <ContentPage slug="terms" />;
}
