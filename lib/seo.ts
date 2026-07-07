import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_ALT, IMAGE_PATHS } from "./images";
import {
  BUSINESS_HOURS,
  BLOG_AUTHOR,
  GOOGLE_SITE_VERIFICATION,
  OFFICES,
  SERVICE_AREA_PROVINCES,
  siteConfig,
  SOCIAL_LINKS,
} from "./site";

const MAX_TITLE_LENGTH = 70;
const MAX_DESCRIPTION_LENGTH = 160;
const LOCALE = "en_ZA";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

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

/** Normalise asset path — page paths get trailing slash; file URLs do not. */
export function normalizeAssetPath(path: string): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const noQuery = withLeading.split(/[?#]/)[0] ?? withLeading;
  if (/\.[a-z0-9]{2,5}$/i.test(noQuery.replace(/\/$/, ""))) {
    return noQuery.replace(/\/$/, "");
  }
  return normalizePath(noQuery);
}

/** Absolute URL for static assets (images) — never adds trailing slash after file extension. */
export function absoluteAssetUrl(path: string): string {
  const base = siteConfig.domain.replace(/\/$/, "");
  const clean = normalizeAssetPath(path);
  return clean === "/" ? `${base}/` : `${base}${clean}`;
}

/** Normalise a path and build a canonical absolute URL (www + trailing slash). */
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

  const slice = trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1);
  const lastSentence = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );
  if (lastSentence >= 100) {
    return slice.slice(0, lastSentence + 1).trimEnd();
  }

  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace >= 80) {
    return `${slice.slice(0, lastSpace).trimEnd()}…`;
  }

  return `${slice.trimEnd()}…`;
}

function stripBrandSuffix(title: string): string {
  return title
    .trim()
    .replace(/\s*[|–-]\s*Damtech(\s+South Africa)?\s*$/i, "")
    .trim();
}

function formatPageTitle(title: string): string {
  const trimmed = stripBrandSuffix(title);
  if (!trimmed || /^home$/i.test(trimmed)) {
    return siteConfig.defaultTitle;
  }
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}

function resolveFullTitle(title: string, isHome: boolean): string {
  if (isHome) return siteConfig.defaultTitle;
  const pageTitle = formatPageTitle(title);
  if (/damtech/i.test(pageTitle)) return trimTitle(pageTitle);
  return `${trimTitle(pageTitle)} | ${siteConfig.name}`;
}

function buildOgImage(imagePath: string) {
  return {
    url: absoluteAssetUrl(imagePath),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: DEFAULT_OG_IMAGE_ALT,
  };
}

/** Root layout metadata — defaults, title template, and global Open Graph / Twitter. */
export function createRootMetadata(): Metadata {
  const ogImage = buildOgImage(DEFAULT_OG_IMAGE);

  return {
    metadataBase: new URL(siteConfig.domain),
    title: {
      default: siteConfig.defaultTitle,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.defaultDescription,
    alternates: {
      canonical: absoluteUrl("/"),
    },
    verification: {
      google: GOOGLE_SITE_VERIFICATION,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      title: siteConfig.defaultTitle,
      description: siteConfig.defaultOgDescription,
      url: absoluteUrl("/"),
      siteName: siteConfig.name,
      locale: LOCALE,
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.defaultTwitterTitle,
      description: siteConfig.defaultTwitterDescription,
      images: [ogImage.url],
    },
    icons: {
      icon: IMAGE_PATHS.damtechLogo,
      apple: IMAGE_PATHS.damtechLogo,
    },
  };
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
  const isHome = normalizePath(path) === "/";
  const fullTitle = resolveFullTitle(title, isHome);
  const metaDescription = ensureDescription(description);
  const ogImagePath = image ?? DEFAULT_OG_IMAGE;
  const ogImage = buildOgImage(ogImagePath);

  const alternates: Metadata["alternates"] = { canonical };

  return {
    ...(isHome ? {} : { title: { absolute: fullTitle } }),
    description: metaDescription,
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
      images: [ogImage],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: metaDescription,
      images: [ogImage.url],
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
    logo: absoluteAssetUrl(IMAGE_PATHS.damtechLogo),
    areaServed: siteConfig.location,
    sameAs: SOCIAL_LINKS,
  };
}

export function createLocalBusinessSchema() {
  const areaServed = SERVICE_AREA_PROVINCES.map((province) => ({
    "@type": "AdministrativeArea" as const,
    name: province,
    containedInPlace: {
      "@type": "Country",
      name: "South Africa",
    },
  }));

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "GeneralContractor"],
    "@id": `${siteConfig.domain}/#localbusiness`,
    name: siteConfig.name,
    url: siteConfig.domain,
    telephone: siteConfig.phone || undefined,
    email: siteConfig.email,
    description: siteConfig.defaultDescription,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    logo: absoluteAssetUrl(IMAGE_PATHS.damtechLogo),
    priceRange: "$$",
    areaServed,
    openingHours: [BUSINESS_HOURS],
    sameAs: [...SOCIAL_LINKS],
    parentOrganization: {
      "@id": `${siteConfig.domain}/#organization`,
    },
    location: OFFICES.map((office) => ({
      "@type": "Place",
      name: office.name,
      telephone: office.phone.replace(/\s/g, ""),
      address: {
        "@type": "PostalAddress",
        addressLocality: office.name.includes("Pretoria")
          ? "Pretoria"
          : "Western Cape",
        addressRegion: office.name.includes("Pretoria")
          ? "Gauteng"
          : "Western Cape",
        addressCountry: "ZA",
      },
    })),
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
  serviceType,
  offers,
}: {
  name: string;
  description: string;
  path: string;
  /** Schema.org `serviceType` — defaults to `name`. */
  serviceType?: string;
  /** Offer names for `hasOfferCatalog.itemListElement`. */
  offers?: readonly string[];
}) {
  const type = serviceType ?? name;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType: type,
    description,
    url: absoluteUrl(path),
    provider: {
      "@type": "LocalBusiness",
      "@id": `${siteConfig.domain}/#localbusiness`,
      name: siteConfig.name,
      url: siteConfig.domain,
      telephone: siteConfig.phone || undefined,
      areaServed: siteConfig.location,
    },
    areaServed: siteConfig.location,
  };

  if (offers && offers.length > 0) {
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `${type} services`,
      itemListElement: offers.map((offerName) => ({
        "@type": "Offer",
        name: offerName,
      })),
    };
  }

  return schema;
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
  const imageUrl = absoluteAssetUrl(image ?? DEFAULT_OG_IMAGE);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: imageUrl,
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: BLOG_AUTHOR.name,
      url: absoluteUrl(BLOG_AUTHOR.path),
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteConfig.domain}/#organization`,
      name: siteConfig.name,
      url: siteConfig.domain,
      logo: {
        "@type": "ImageObject",
        url: absoluteAssetUrl(IMAGE_PATHS.damtechLogo),
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
