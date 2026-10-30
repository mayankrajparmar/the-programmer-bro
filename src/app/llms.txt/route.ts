import { isLive } from "@/config/site-mode";
import { llmsTxt } from "@/features/llms";

/* A Markdown map of the site for AI tools (llmstxt.org). Built once at build time. */
export function GET() {
  if (!isLive) return new Response("Not found", { status: 404 });
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
