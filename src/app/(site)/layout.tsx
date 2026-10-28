import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { isLive } from "@/config/site-mode";

/** Every page of the full site. Until launch, production answers these routes with a 404. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  if (!isLive) notFound();
  return <SiteShell>{children}</SiteShell>;
}
