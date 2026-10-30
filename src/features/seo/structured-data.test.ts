import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./components/json-ld";
import {
  breadcrumbNode,
  isoDateTime,
  jsonLdGraph,
  ORGANIZATION_ID,
  organizationNode,
  websiteNode,
} from "./structured-data";

describe("structured data", () => {
  it("numbers breadcrumbs from 1 with absolute URLs", () => {
    const crumbs = breadcrumbNode([
      { name: "Learn", path: "/learn" },
      { name: "How AI Works", path: "/learn/how-ai-works" },
    ]);
    expect(crumbs.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Learn",
        item: "https://theprogrammerbro.in/learn",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "How AI Works",
        item: "https://theprogrammerbro.in/learn/how-ai-works",
      },
    ]);
  });

  it("always includes the publisher once, so references resolve", () => {
    const withOrg = jsonLdGraph(organizationNode(), websiteNode());
    expect(withOrg["@graph"].filter((node) => node["@id"] === ORGANIZATION_ID)).toHaveLength(1);
    const withoutOrg = jsonLdGraph(websiteNode());
    expect(withoutOrg["@graph"].map((node) => node["@type"])).toEqual([
      "WebSite",
      "Organization",
      "Person",
    ]);
  });

  it("describes the organisation with its logo and social profiles", () => {
    expect(organizationNode()).toMatchObject({
      name: "The Programmer Bro",
      url: "https://theprogrammerbro.in/",
      logo: { url: "https://theprogrammerbro.in/icon-512.png" },
      sameAs: expect.arrayContaining([expect.stringContaining("linkedin.com")]),
    });
  });

  it("turns content dates into ISO 8601 date-times with India's offset", () => {
    expect(isoDateTime("2026-10-30")).toBe("2026-10-30T00:00:00+05:30");
    expect(() => isoDateTime("30 Oct 2026")).toThrow(/YYYY-MM-DD/);
  });

  it("escapes < so content can't close the script tag", () => {
    const text = serializeJsonLd(jsonLdGraph({ "@type": "Thing", name: "</script><b>" }));
    expect(text).not.toContain("<");
    expect(JSON.parse(text)["@graph"][0].name).toBe("</script><b>");
  });
});
