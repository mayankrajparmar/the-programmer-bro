// Public surface of search and sharing: page metadata, structured data and share cards.
export { JsonLd, serializeJsonLd } from "./components/json-ld";
export { DEFAULT_SHARE_IMAGE, seoMetadata, type PageSeo } from "./metadata";
export { renderShareImage, SHARE_IMAGE_SIZE, type ShareCard } from "./og/share-image";
export {
  absoluteUrl,
  breadcrumbNode,
  FOUNDER_ID,
  founderNode,
  jsonLdGraph,
  LANGUAGE,
  ORGANIZATION_ID,
  organizationNode,
  publisherRef,
  WEBSITE_ID,
  websiteNode,
  type JsonLdGraph,
  type JsonLdNode,
} from "./structured-data";
