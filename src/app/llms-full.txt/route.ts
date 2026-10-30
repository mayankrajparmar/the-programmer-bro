import { isLive } from "@/config/site-mode";
import { llmsFullTxt } from "@/features/llms";

/* Every published lesson as Markdown, for AI tools. Built once at build time. */
export function GET() {
  if (!isLive) return new Response("Not found", { status: 404 });
  return new Response(llmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
