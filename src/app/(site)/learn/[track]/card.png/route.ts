import { getTrackSlugs, trackShareImage } from "@/features/learn";

/* The track's share card, at a stable address (…/card.png). Built once at build time. */
export function generateStaticParams() {
  return getTrackSlugs().map((track) => ({ track }));
}

export async function GET(_request: Request, { params }: RouteContext<"/learn/[track]/card.png">) {
  return trackShareImage((await params).track);
}
