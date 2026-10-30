// Public surface of the site's own pages: About, Privacy, Terms, AI-content disclaimer, Contact.
export { ContentPage, pageMetadata } from "./components/content-page";
export { PAGE_SLUGS, type PageSlug } from "./schema";
export { getPage, getPageSitemapEntries, type SitePage } from "./server/pages";
