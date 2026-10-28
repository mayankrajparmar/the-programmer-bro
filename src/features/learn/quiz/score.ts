/** Joins numbers for a sentence: "1", "1 and 3", "1, 2 and 4". */
function listNumbers(numbers: number[]): string {
  if (numbers.length <= 1) return numbers.join("");
  return `${numbers.slice(0, -1).join(", ")} and ${numbers.at(-1)}`;
}

/** The line under "You scored X of N", pointing at what to look at again. */
export function scoreMessage(score: number, total: number, missed: number[]): string {
  if (score === total) return "Perfect score. You've nailed this one.";
  if (score / total >= 0.8) {
    const which = missed.length === 1 ? "question" : "questions";
    return `Nicely done. Take one more look at ${which} ${listNumbers(missed)}, then carry on.`;
  }
  if (score / total >= 0.5) {
    return "Good start. Read the explanations for the ones you missed, then try again.";
  }
  return "No stress. Skim the lesson once more and retry: it usually clicks the second time.";
}
