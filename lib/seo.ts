import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "./images";
import { siteConfig } from "./site";

const MAX_TITLE_LENGTH = 70;
const MAX_DESCRIPTION_LENGTH = 160;
const LOCALE = "en_ZA";

export type CreateMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Override canonical path (e.g. category archives → /blog/). */
  canonicalPath?: string;
  image?: string;
  noIndex?: boolean;
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export type BreadcrumbItem = {
  name: string;
  path: string;
};

/** Normalise path to WordPress-style trailing slash (except root). */
export function normalizePath(path: string): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  if (normalised === "/") return "/";
  return normalised.endsWith("/") ? normalised : `${normalised}/`;
}

/** Normalise a path and build a non-www absolute URL. */
export function absoluteUrl(path: string): string {
  const base = siteConfig.domain.replace(/\/$/, "");
  const clean = normalizePath(path);
  return clean === "/" ? `${base}/` : `${base}${clean}`;
}

function trimTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}

function ensureDescription(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) {
    return siteConfig.defaultDescription;
  }
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}

function formatPageTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed || /^home$/i.test(trimmed)) {
    return siteConfig.defaultTitle;
  }
  if (/damtech/i.test(trimmed)) {
    return trimTitle(trimmed);
  }
  return trimTitle(`${trimmed} | ${siteConfig.name}`);
}

export function createMetadata({
  title,
  description,
  path,
  canonicalPath,
  image,
  noIndex = false,
  ogType = "website",
  publishedTime,
  modifiedTime,
}: CreateMetadataInput): Metadata {
  const canonical = absoluteUrl(canonicalPath ?? path);
  const fullTitle = formatPageTitle(title);
  const metaDescription = ensureDescription(description);
  const ogImagePath = image ?? DEFAULT_OG_IMAGE;
  const ogImage = absoluteUrl(ogImagePath);

  const alternates: Metadata["alternates"] = { canonical };

  return {
    title: { absolute: fullTitle },
    description: metaDescription,
    metadataBase: new URL(siteConfig.domain),
    alternates,
    robots: noIndex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
    openGraph: {
      title: fullTitle,
      description: metaDescription,
      url: canonical,
      siteName: siteConfig.name,
      locale: LOCALE,
      type: ogType,
      images: [{ url: ogImage, width: 1600, height: 900, alt: siteConfig.name }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: metaDescription,
      images: [ogImage],
    },
  };
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.domain}/#organization`,
    name: siteConfig.name,
    url: siteConfig.domain,
    email: siteConfig.email,
    telephone: siteConfig.phone || undefined,
    description: siteConfig.defaultDescription,
    logo: absoluteUrl(DEFAULT_OG_IMAGE),
    areaServed: siteConfig.location,
  };
}

export function createLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.domain}/#localbusiness`,
    name: siteConfig.name,
    url: siteConfig.domain,
    telephone: siteConfig.phone || undefined,
    email: siteConfig.email,
    description: siteConfig.defaultDescription,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    areaServed: siteConfig.location,
    parentOrganization: {
      "@id": `${siteConfig.domain}/#organization`,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "ZA",
    },
    serviceType: [
      "Dam liners",
      "HDPE dam lining",
      "PVC dam lining",
      "Bitumen waterproofing",
      "Steel water tanks",
      "Leak repair",
      "Reservoir maintenance",
    ],
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.domain}/#website`,
    name: siteConfig.name,
    url: siteConfig.domain,
    description: siteConfig.defaultDescription,
    publisher: {
      "@id": `${siteConfig.domain}/#organization`,
    },
    inLanguage: "en-ZA",
  };
}

export function createServiceSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: absoluteUrl(path),
    provider: {
      "@id": `${siteConfig.domain}/#organization`,
    },
    areaServed: siteConfig.location,
  };
}

export function createArticleSchema({
  title,
  description,
  path,
  datePublished,
  dateModified,
  image,
}: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  image?: string;
}) {
  const imageUrl = absoluteUrl(image ?? DEFAULT_OG_IMAGE);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: imageUrl,
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: "Tiaan",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteConfig.domain}/#organization`,
      name: siteConfig.name,
      url: siteConfig.domain,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(DEFAULT_OG_IMAGE),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(path),
    },
  };
}

export function createFaqPageSchema(
  items: ReadonlyArray<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
