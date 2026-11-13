import { BRAND_NAME } from "@/lib/branding/brand";

/**
 * Shared landing-page content used by both the rendered sections and the
 * structured data (JSON-LD) in the route head, so the markup search engines
 * read can never drift from what visitors see.
 */

// Canonical production host, matching sitemap.xml, robots.txt and DOCS_BASE_URL.
export const SITE_URL = "https://cyloo.ai";
export const OG_IMAGE_URL = `${SITE_URL}/api/public/og.png`;

export function getLandingContent(brandName: string) {
  const name = brandName.trim() || BRAND_NAME;
  return {
    title: `${name} | Intelligence Business Platform`,
    description: `Bring conversations, customers, projects, marketing, and everyday tasks together with ${name}, the intelligence business platform built to help you move forward.`,
  };
}

export const { title: LANDING_TITLE, description: LANDING_DESCRIPTION } =
  getLandingContent(BRAND_NAME);

export const LANDING_SOCIAL_DESCRIPTION =
  "CYLOO — Intelligence Business Platform. One place for conversations, customers, projects, marketing, and AI-powered work.";

/** JSON-LD graph for the landing page: organization, website, and software. */
export function landingJsonLd(brandName = BRAND_NAME) {
  const name = brandName.trim() || BRAND_NAME;
  const content = getLandingContent(name);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name,
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
        description: LANDING_SOCIAL_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name,
        description: content.description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "CRM",
        operatingSystem: "Web, iOS, Android",
        url: SITE_URL,
        image: OG_IMAGE_URL,
        description: content.description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        featureList: [
          "Shared WhatsApp team inbox",
          "Sales pipeline and CRM",
          "AI chatbots and AI Studio",
          "Broadcast and drip campaigns",
          "No-code workflow automation",
          "WhatsApp commerce and catalogues",
          "Multi-tenant workspaces with RLS",
        ],
      },
    ],
  };
}
