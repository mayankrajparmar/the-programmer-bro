/*
 * Which stories are worth summarising. General tech feeds (filterAi in
 * content/news-sources.json) must mention AI in the title or opening.
 */

/** Only stories published in the last 48 hours are new enough. */
export const MAX_AGE_HOURS = 48;

const AI_TERMS: RegExp[] = [
  /\bA\.?I\b/, // "AI" in capitals, so it doesn't match words like "said"
  /\bGenAI\b/i,
  /IndiaAI/i,
  /artificial intelligence/i,
  /machine learning/i,
  /deep learning/i,
  /neural net/i,
  /\bLLMs?\b/i,
  /language models?\b/i,
  /foundation models?\b/i,
  /generative/i,
  /chatbots?\b/i,
  /\bGPT/i,
  /ChatGPT/i,
  /OpenAI/i,
  /Anthropic/i,
  /\bClaude\b/,
  /\bGemini\b/,
  /DeepMind/i,
  /Copilot/i,
  /\bLlama\b/,
  /Mistral/i,
  /DeepSeek/i,
  /Hugging ?Face/i,
  /Sarvam/i,
  /Krutrim/i,
  /Bhashini/i,
];

export function mentionsAi(text: string): boolean {
  return AI_TERMS.some((term) => term.test(text));
}

export function isRecent(publishedAt: Date, now: Date, maxAgeHours = MAX_AGE_HOURS): boolean {
  const age = now.getTime() - publishedAt.getTime();
  // Allow a little clock skew for stories dated slightly in the future.
  return age <= maxAgeHours * 3_600_000 && age >= -3_600_000;
}
