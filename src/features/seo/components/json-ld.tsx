import type { JsonLdGraph } from "../structured-data";

/**
 * Renders structured data as a JSON-LD script tag, as the Next.js guide recommends.
 * "<" is escaped so text from content files can never close the script early.
 */
export function JsonLd({ data }: { data: JsonLdGraph }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

export function serializeJsonLd(data: JsonLdGraph): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
