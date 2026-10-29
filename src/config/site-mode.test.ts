import { describe, expect, it } from "vitest";
import { resolveSiteMode } from "./site-mode";

describe("resolveSiteMode", () => {
  it("shows the full site everywhere now that it has launched", () => {
    expect(resolveSiteMode({ VERCEL_ENV: "production" })).toBe("live");
    expect(resolveSiteMode({ VERCEL_ENV: "preview" })).toBe("live");
    expect(resolveSiteMode({})).toBe("live");
  });

  it("can put the site back behind the coming-soon page", () => {
    expect(resolveSiteMode({ VERCEL_ENV: "production", SITE_MODE: "coming-soon" })).toBe(
      "coming-soon",
    );
  });

  it("ignores an unknown SITE_MODE", () => {
    expect(resolveSiteMode({ VERCEL_ENV: "production", SITE_MODE: "yes" })).toBe("live");
  });
});
