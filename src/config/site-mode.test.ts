import { describe, expect, it } from "vitest";
import { resolveSiteMode } from "./site-mode";

describe("resolveSiteMode", () => {
  it("keeps production on the coming-soon page until launch", () => {
    expect(resolveSiteMode({ VERCEL_ENV: "production" })).toBe("coming-soon");
  });

  it("shows the full site on previews and locally", () => {
    expect(resolveSiteMode({ VERCEL_ENV: "preview" })).toBe("live");
    expect(resolveSiteMode({})).toBe("live");
  });

  it("lets SITE_MODE override the default either way", () => {
    expect(resolveSiteMode({ VERCEL_ENV: "production", SITE_MODE: "live" })).toBe("live");
    expect(resolveSiteMode({ VERCEL_ENV: "preview", SITE_MODE: "coming-soon" })).toBe(
      "coming-soon",
    );
  });

  it("ignores an unknown SITE_MODE", () => {
    expect(resolveSiteMode({ VERCEL_ENV: "production", SITE_MODE: "yes" })).toBe("coming-soon");
  });
});
