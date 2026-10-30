import { getLessonParams, lessonShareImage } from "@/features/learn";

/*
 * The lesson's share card, at a stable address (…/card.png) so page metadata and
 * structured data can both point at it. Built once per lesson at build time.
 */
export function generateStaticParams() {
  return getLessonParams();
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/learn/[track]/[lesson]/card.png">,
) {
  const { track, lesson } = await params;
  return lessonShareImage(track, lesson);
}
