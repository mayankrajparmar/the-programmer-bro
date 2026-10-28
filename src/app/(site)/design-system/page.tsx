import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { showInternalPages } from "@/config/site-mode";
import { DesignSystemPage } from "@/features/design-system";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (!showInternalPages) notFound();
  return <DesignSystemPage />;
}
