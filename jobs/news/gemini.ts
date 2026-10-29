import { ApiError, GoogleGenAI } from "@google/genai";
import {
  RESPONSE_SCHEMA,
  SYSTEM_PROMPT,
  SummarizerError,
  type Summarizer,
  type SummaryInput,
} from "./summarize.ts";

/** Gemini 3.5 Flash-Lite: Google's fastest, cheapest current model, on the free tier. */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

export function createGeminiSummarizer({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
}: {
  apiKey: string;
  model?: string;
}): Summarizer {
  // Retries are handled in summariseAll, so a quota error isn't retried five times.
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 60_000, retryOptions: { attempts: 1 } },
  });

  return {
    name: `Gemini (${model})`,
    async summarize(items: SummaryInput[]) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: JSON.stringify({ items }),
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseJsonSchema: RESPONSE_SCHEMA,
            temperature: 0.3,
          },
        });
        return response.text ?? "";
      } catch (error) {
        if (error instanceof ApiError) {
          const quota = error.status === 429;
          throw new SummarizerError(
            quota
              ? "over the free-tier quota (HTTP 429); the next run tries again"
              : `HTTP ${error.status}: ${error.message.slice(0, 300)}`,
            { retry: !quota && (error.status >= 500 || error.status === 408) },
          );
        }
        throw new SummarizerError((error as Error).message ?? String(error), { retry: true });
      }
    },
  };
}
