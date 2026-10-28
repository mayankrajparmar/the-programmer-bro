import type { Metadata } from "next";
import { notFound } from "next/navigation";

/*
 * Lessons and tracks are fully static. This also makes an unknown slug wait
 * for its render, so it gets a real 404 status instead of a streamed fallback.
 */
export const ensureStatic = "navigation";
import { getTrack, getTrackSlugs, TrackPage } from "@/features/learn";

export function generateStaticParams() {
  return getTrackSlugs().map((track) => ({ track }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[track]">): Promise<Metadata> {
  const track = getTrack((await params).track);
  if (!track) return {};
  return {
    title: track.title,
    description: track.description,
    alternates: { canonical: track.href },
  };
}

export default async function Page({ params }: PageProps<"/learn/[track]">) {
  const track = getTrack((await params).track);
  if (!track) notFound();
  return <TrackPage track={track} />;
}
