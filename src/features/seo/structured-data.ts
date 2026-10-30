import { site } from "@/config/site";

/*
 * Schema.org structured data (JSON-LD), so search engines and AI answer engines can
 * tell what each page is: who publishes the site, which course a lesson belongs to,
 * what it cites and when a person last reviewed it. Nodes link to each other by @id.
 * Only markup that describes what's visible on the page; no FAQ or quiz answers.
 */

export type JsonLdNode = { "@type": string | string[]; "@id"?: string } & Record<string, unknown>;

export interface JsonLdGraph {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
}

/** An absolute URL on the canonical origin. */
export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

export const ORGANIZATION_ID = absoluteUrl("/#organization");
export const WEBSITE_ID = absoluteUrl("/#website");
export const FOUNDER_ID = absoluteUrl("/#founder");

export const LANGUAGE = "en-IN";

/** The Programmer Bro as a publisher: name, logo, contact and social profiles. */
export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon-512.png"),
      width: 512,
      height: 512,
    },
    description: site.description,
    email: site.contactEmail,
    sameAs: site.social.map((profile) => profile.href),
    founder: { "@id": FOUNDER_ID },
  };
}

/** The person who runs the site and reviews every lesson before it's published. */
export function founderNode(): JsonLdNode {
  return {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: site.author.name,
    url: site.author.url,
    worksFor: { "@id": ORGANIZATION_ID },
  };
}

export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: site.name,
    description: site.description,
    inLanguage: LANGUAGE,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * The publisher, inline: type, name and URL alongside its @id. Google doesn't always
 * follow @id references, so properties it checks (a course's provider, an article's
 * author) carry the essentials themselves.
 */
export function publisherRef(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: absoluteUrl("/"),
  };
}

/** The trail from the home page to this one, matching the visible breadcrumbs. */
export function breadcrumbNode(items: readonly { name: string; path: string }[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Wraps nodes in one @graph, with the publisher always included so references resolve. */
export function jsonLdGraph(...nodes: JsonLdNode[]): JsonLdGraph {
  const ids = new Set(nodes.map((node) => node["@id"]));
  const publisher = [organizationNode(), founderNode()].filter((node) => !ids.has(node["@id"]));
  return { "@context": "https://schema.org", "@graph": [...nodes, ...publisher] };
}
