import { describe, expect, it } from "vitest";
import { scoreMessage } from "./score";

describe("scoreMessage", () => {
  it("celebrates a perfect score", () => {
    expect(scoreMessage(6, 6, [])).toMatch(/Perfect/);
  });

  it("points at the questions to look at again", () => {
    expect(scoreMessage(5, 6, [1])).toBe(
      "Nicely done. Take one more look at question 1, then carry on.",
    );
    expect(scoreMessage(7, 8, [2])).toContain("question 2");
    expect(scoreMessage(8, 10, [1, 4])).toContain("questions 1 and 4");
  });

  it("encourages a retry when the score is low", () => {
    expect(scoreMessage(3, 6, [1, 2, 3])).toMatch(/Good start/);
    expect(scoreMessage(1, 6, [1, 2, 3, 4, 5])).toMatch(/No stress/);
  });
});
