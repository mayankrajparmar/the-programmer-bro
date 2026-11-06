import { aiLayersMarkdown } from "./ai-layers";
import { aiTimelineMarkdown } from "./ai-timeline";
import { baseModelMarkdown, basePatternMarkdown, trainingStagesMarkdown } from "./base-model";
import { llmSizesMarkdown } from "./llm-sizes";
import { digitGuessesMarkdown, digitNetworkMarkdown } from "./digit-network";
import { attentionMarkdown, transformerPipelineMarkdown } from "./gpt2-attention";
import { lossCurveMarkdown, samosaHillMarkdown } from "./how-models-learn";
import { meaningMapMarkdown } from "./meaning-map";
import { neuronMarkdown } from "./neuron";
import { nextTokenMarkdown } from "./next-token";
import { ragPipelineMarkdown } from "./rag-pipeline";
import { aimeMarkdown, thinkingMarkdown } from "./reasoning";
import { searchVsLlmMarkdown } from "./search-vs-llm";
import { hindiTokensMarkdown, tokenIdsMarkdown } from "./tokens";
import { blockMarkdown } from "./transformer-block";

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
  NeuronDiagram: neuronMarkdown,
  DigitNetworkDiagram: digitNetworkMarkdown,
  DigitGuessesDiagram: digitGuessesMarkdown,
  TransformerPipelineDiagram: transformerPipelineMarkdown,
  AttentionDiagram: attentionMarkdown,
  BlockDiagram: blockMarkdown,
  SamosaHillDiagram: samosaHillMarkdown,
  LossCurveDiagram: lossCurveMarkdown,
  BaseModelDiagram: baseModelMarkdown,
  BasePatternDiagram: basePatternMarkdown,
  TrainingStagesDiagram: trainingStagesMarkdown,
  ThinkingDiagram: thinkingMarkdown,
  AimeDiagram: aimeMarkdown,
};
