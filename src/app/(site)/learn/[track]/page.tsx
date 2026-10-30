import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getTrack,
  getTrackSlugs,
  shareCardImage,
  TRACK_SHARE_ALT,
  TrackPage,
} from "@/features/learn";
import { seoMetadata } from "@/features/seo";

/*
 * Tracks are fully static. This also makes an unknown slug wait for its
 * render, so it gets a real 404 status instead of a streamed fallback.
 */
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return getTrackSlugs().map((track) => ({ track }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[track]">): Promise<Metadata> {
  const track = getTrack((await params).track);
  if (!track) return {};
  return seoMetadata({
    title: `${track.title}: a free AI course`,
    description: track.description,
    path: track.href,
    image: shareCardImage(track, TRACK_SHARE_ALT),
  });
}

export default async function Page({ params }: PageProps<"/learn/[track]">) {
  const track = getTrack((await params).track);
  if (!track) notFound();
  return <TrackPage track={track} />;
}
