import { aiLayersMarkdown } from "./ai-layers";
import { aiTimelineMarkdown } from "./ai-timeline";
import { llmSizesMarkdown } from "./llm-sizes";

/**
 * Every diagram's content as Markdown, keyed by its MDX component name. The Markdown
 * copy of a lesson uses it in place of the picture; a test checks no diagram is missing.
 */
export const DIAGRAM_MARKDOWN: Record<string, string> = {
  AiLayersDiagram: aiLayersMarkdown,
  AiTimelineDiagram: aiTimelineMarkdown,
  LlmSizesDiagram: llmSizesMarkdown,
};
