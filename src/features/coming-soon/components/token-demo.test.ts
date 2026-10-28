import { describe, expect, it } from "vitest";
import { NARROW, placeTokens, WIDE } from "./token-demo";

const xs = (layout: typeof WIDE) => placeTokens(layout).map((token) => token.x);

describe("placeTokens", () => {
  it("matches the desktop artboard", () => {
    expect(xs(WIDE)).toEqual([121.5, 195.5, 251.5, 325.5, 126, 182, 229, 330]);
  });

  it("matches the phone artboard", () => {
    expect(xs(NARROW)).toEqual([34.5, 106.5, 160.5, 232.5, 39, 93, 138, 237]);
  });

  it("numbers tokens in reading order across both rows", () => {
    const tokens = placeTokens(WIDE);
    expect(tokens.map((token) => token.text).join(" ")).toBe(
      "Your Sw iggy order is 5 minutes away",
    );
    expect(tokens.map((token) => token.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(tokens.map((token) => token.y))).toEqual(new Set([134, 184]));
  });
});
