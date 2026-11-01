import { aiLayersMarkdown } from "./ai-layers";
import { aiTimelineMarkdown } from "./ai-timeline";
import { llmSizesMarkdown } from "./llm-sizes";
import { meaningMapMarkdown } from "./meaning-map";
import { nextTokenMarkdown } from "./next-token";
import { ragPipelineMarkdown } from "./rag-pipeline";
import { searchVsLlmMarkdown } from "./search-vs-llm";
import { hindiTokensMarkdown, tokenIdsMarkdown } from "./tokens";

/**
 * Every diagram's content as Markdown, keyed by its MDX component name. The Markdown
 * copy of a lesson uses it in place of the picture; a test checks no diagram is missing.
 */
export const DIAGRAM_MARKDOWN: Record<string, string> = {
  AiLayersDiagram: aiLayersMarkdown,
  AiTimelineDiagram: aiTimelineMarkdown,
  LlmSizesDiagram: llmSizesMarkdown,
  NextTokenDiagram: nextTokenMarkdown,
  TokenIdsDiagram: tokenIdsMarkdown,
  HindiTokensDiagram: hindiTokensMarkdown,
  SearchVsLlmDiagram: searchVsLlmMarkdown,
  MeaningMapDiagram: meaningMapMarkdown,
  RagPipelineDiagram: ragPipelineMarkdown,
};
