import { cn } from "@/lib/utils";
import { ENGLISH_SENTENCE, ENGLISH_TOKENS, HINDI_SENTENCE, HINDI_TOKENS } from "./token-data";

/*
 * Lesson 5, figures 1 and 2: a sentence split into tokens by GPT-4o's tokenizer.
 * Each token is a chip; alternate chips are tinted so the boundaries show, and a
 * leading space is drawn as a faint dot. Lists, so screen readers read every token.
 */

/** How a token reads aloud: its text, and whether a space comes before it. */
const spoken = (text: string) => (text.startsWith(" ") ? `space then ${text.trimStart()}` : text);

function Chip({ text, index, id }: { text: string; index: number; id?: number }) {
  const space = text.startsWith(" ");
  return (
    <li className="flex flex-col items-center gap-1">
      <span
        aria-hidden
        className={cn(
          "rounded-sm border px-2 py-1 font-mono text-code-small whitespace-pre",
          index % 2 === 0
            ? "border-amber bg-amber-subtle"
            : "border-border-strong bg-surface-raised",
        )}
      >
        {space && <span className="text-text-muted">·</span>}
        {text.trimStart()}
      </span>
      {id !== undefined && (
        <span aria-hidden className="font-mono text-caption text-text-muted">
          {id}
        </span>
      )}
      <span className="sr-only">
        {spoken(text)}
        {id !== undefined && `, ID ${id}`}
      </span>
    </li>
  );
}

export function TokenIdsDiagram() {
  return (
    <div className="grid gap-4">
      <p className="m-0 font-mono text-code">{ENGLISH_SENTENCE}</p>
      <ol
        aria-label={`“${ENGLISH_SENTENCE}” as ${ENGLISH_TOKENS.length} tokens, each with its ID`}
        className="m-0 flex list-none flex-wrap gap-x-2 gap-y-3 p-0"
      >
        {ENGLISH_TOKENS.map((token, index) => (
          <Chip key={index} text={token.text} id={token.id} index={index} />
        ))}
      </ol>
    </div>
  );
}

export function HindiTokensDiagram() {
  return (
    <div className="grid gap-4">
      <p lang="hi" className="m-0 text-lesson">
        {HINDI_SENTENCE}
      </p>
      <ol
        lang="hi"
        aria-label={`The same sentence in Hindi as ${HINDI_TOKENS.length} tokens`}
        className="m-0 flex list-none flex-wrap gap-2 p-0"
      >
        {HINDI_TOKENS.map((text, index) => (
          <Chip key={index} text={text} index={index} />
        ))}
      </ol>
    </div>
  );
}

const quoted = (text: string) => `"${text}"`;

/** The figures as text, for the Markdown copy of the lesson (llms-full.txt). */
export const tokenIdsMarkdown = [
  `${quoted(ENGLISH_SENTENCE)} as ${ENGLISH_TOKENS.length} tokens (GPT-4o's tokenizer), with their IDs:`,
  "",
  ...ENGLISH_TOKENS.map((token) => `- ${quoted(token.text)}: ${token.id}`),
].join("\n");

export const hindiTokensMarkdown = [
  `${quoted(HINDI_SENTENCE)} as ${HINDI_TOKENS.length} tokens (GPT-4o's tokenizer):`,
  "",
  HINDI_TOKENS.map(quoted).join(", "),
].join("\n");
