import { ContentPage, pageMetadata } from "@/features/pages";

export const metadata = pageMetadata("contact");

/* Built once from content/pages/contact.mdx. */
export const ensureStatic = "navigation";

export default function Page() {
  return <ContentPage slug="contact" />;
}
