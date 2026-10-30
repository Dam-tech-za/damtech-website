import type { Metadata } from "next";
import {
  CATALOGUE_MERCHANT_AVAILABILITY,
  merchantAvailabilityToSchemaUrl,
} from "./catalogue/availability.ts";
import {
  createMerchantReturnPolicySchema,
  createOfferMerchantReturnPolicy,
  createOfferShippingDetails,
  createShippingServiceSchema,
} from "./catalogue/merchant-policies.ts";
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_ALT, IMAGE_PATHS, altForImagePath } from "./images";
import { OG_IMAGE_DERIVATIVES } from "./og-images.generated";
import { LEGAL_ENTITY } from "./legal-entity.ts";
import {
  BUSINESS_HOURS,
  BLOG_AUTHOR,
  GOOGLE_SITE_VERIFICATION,
  HEAD_OFFICE,
  OFFICES,
  phoneTel,
  SERVICE_AREA_PROVINCES,
  siteConfig,
  SOCIAL_LINKS,
} from "./site";

const MAX_TITLE_LENGTH = 70;
/** Hard cap only for runaway strings — approved P1 metas may exceed the 155 soft warn. */
const MAX_DESCRIPTION_LENGTH = 180;
/** Soft SEO limits — warn in development/build when exceeded (do not invent shorter copy). */
const WARN_TITLE_LENGTH = 60;
const WARN_DESCRIPTION_LENGTH = 155;
const LOCALE = "en_ZA";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
/**
 * Offer price window for catalogue kits.
 * `validFrom` is the date the current VAT-inclusive kit prices took effect
 * (550 gsm pricing, 27 Oct 2026). Move both dates whenever prices are re-confirmed.
 */
export const PRODUCT_PRICE_VALID_FROM = "2026-10-27T00:00:00+02:00";
export const PRODUCT_PRICE_VALID_UNTIL = "2027-01-31";

export type CreateMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Override canonical path (e.g. category archives → /blog/). */
  canonicalPath?: string;
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Override Open Graph title when it should differ from the page title. */
  ogTitle?: string;
  /** Override Open Graph description when it should differ from meta description. */
  ogDescription?: string;
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
  if (/^https?:\/\//i.test(path)) {
    const url = new URL(path);
    return `${url.origin}${normalizeAssetPath(url.pathname)}`;
  }
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
  const lastSpace = trimmed.slice(0, MAX_TITLE_LENGTH - 1).lastIndexOf(" ");
  if (lastSpace >= 40) {
    return `${trimmed.slice(0, lastSpace).trimEnd()}…`;
  }
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
  if (lastSpace >= 40) {
    return `${slice.slice(0, lastSpace).trimEnd()}…`;
  }

  return `${slice.trimEnd()}…`;
}

function warnMetaLength(title: string, description: string, path: string) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    return;
  }
  if (title.length > WARN_TITLE_LENGTH) {
    console.warn(
      `[seo] Title exceeds ${WARN_TITLE_LENGTH} chars (${title.length}) for ${path}: ${title}`,
    );
  }
  if (description.length > WARN_DESCRIPTION_LENGTH) {
    console.warn(
      `[seo] Description exceeds ${WARN_DESCRIPTION_LENGTH} chars (${description.length}) for ${path}: ${description}`,
    );
  }
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
  const trimmed = title.trim();
  // Keep intentionally branded titles (e.g. "… | Damtech South Africa") verbatim.
  if (/damtech/i.test(trimmed)) {
    return trimTitle(trimmed);
  }
  const pageTitle = formatPageTitle(trimmed);
  if (/damtech/i.test(pageTitle)) return trimTitle(pageTitle);
  return `${trimTitle(pageTitle)} | ${siteConfig.name}`;
}

/**
 * Share previews use a 1200×630 JPEG copy (public/og/, under 300 KB) when one
 * exists: the 2–3 MB WebP originals often fail in WhatsApp/Facebook previews.
 */
export function ogImagePath(imagePath: string): string {
  if (!OG_IMAGE_DERIVATIVES.has(imagePath)) return imagePath;
  const name = imagePath.split("/").pop()!.replace(/\.[a-z0-9]+$/i, "");
  return `/og/${name}.jpg`;
}

function buildOgImage(imagePath: string, alt?: string) {
  return {
    url: absoluteAssetUrl(ogImagePath(imagePath)),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: alt ?? altForImagePath(imagePath) ?? DEFAULT_OG_IMAGE_ALT,
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
    // No site-wide canonical: every indexable page sets its own via
    // createMetadata(). A root canonical of "/" leaked onto noindex utility
    // pages (/order/, /quote/success/ …) that set none.
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
      title: siteConfig.defaultOgTitle ?? siteConfig.defaultTitle,
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
    // Favicon set: 32 tab, 48 ICO (Google), 192 app, 512 Google/single-upload, Apple touch.
    icons: {
      icon: [
        { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/favicon-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-touch-icon.png" }],
    },
  };
}

export function createMetadata({
  title,
  description,
  path,
  canonicalPath,
  image,
  imageAlt,
  noIndex = false,
  ogType = "website",
  publishedTime,
  modifiedTime,
  ogTitle,
  ogDescription,
}: CreateMetadataInput): Metadata {
  const canonical = absoluteUrl(canonicalPath ?? path);
  const isHome = normalizePath(path) === "/";
  const fullTitle = resolveFullTitle(title, isHome);
  const metaDescription = ensureDescription(description);
  warnMetaLength(fullTitle, metaDescription, path);
  const ogImagePath = image ?? DEFAULT_OG_IMAGE;
  const ogImage = buildOgImage(ogImagePath, imageAlt);

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
      title: isHome
        ? (siteConfig.defaultOgTitle ?? fullTitle)
        : (ogTitle ?? fullTitle),
      description: isHome
        ? siteConfig.defaultOgDescription
        : (ogDescription ?? metaDescription),
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
      title: isHome
        ? (siteConfig.defaultTwitterTitle ?? fullTitle)
        : fullTitle,
      description: isHome
        ? (siteConfig.defaultTwitterDescription ?? metaDescription)
        : metaDescription,
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

export function createWebPageSchema(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.name,
    description: input.description,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteConfig.domain}/#website`,
    },
    inLanguage: "en-ZA",
  };
}

export function createOrganizationSchema() {
  const googleProfiles = OFFICES.flatMap((office) =>
    "googleBusinessProfileUrl" in office && office.googleBusinessProfileUrl
      ? [office.googleBusinessProfileUrl]
      : [],
  );

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.domain}/#organization`,
    name: siteConfig.name,
    legalName: LEGAL_ENTITY.legalName,
    alternateName: "Damtech South Africa",
    url: siteConfig.domain,
    email: siteConfig.email,
    telephone: phoneTel,
    description: siteConfig.defaultDescription,
    logo: absoluteAssetUrl(IMAGE_PATHS.damtechLogo),
    areaServed: siteConfig.location,
    sameAs: [...SOCIAL_LINKS, ...googleProfiles],
    founder: {
      "@type": "Person",
      name: BLOG_AUTHOR.name,
      jobTitle: BLOG_AUTHOR.role,
      url: absoluteUrl(BLOG_AUTHOR.path),
    },
    hasMerchantReturnPolicy: createMerchantReturnPolicySchema(),
    hasShippingService: createShippingServiceSchema(),
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
    telephone: phoneTel,
    email: siteConfig.email,
    description: siteConfig.defaultDescription,
    image: absoluteAssetUrl(DEFAULT_OG_IMAGE),
    logo: absoluteAssetUrl(IMAGE_PATHS.damtechLogo),
    priceRange: "$$",
    areaServed,
    ...(BUSINESS_HOURS.length > 0
      ? {
          openingHoursSpecification: BUSINESS_HOURS.map((hours) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [...hours.dayOfWeek],
            opens: hours.opens,
            closes: hours.closes,
          })),
        }
      : {}),
    sameAs: [...SOCIAL_LINKS],
    parentOrganization: {
      "@id": `${siteConfig.domain}/#organization`,
    },
    // Service-area business: province-level only — no street address (clients do not visit).
    address: {
      "@type": "PostalAddress",
      addressLocality: HEAD_OFFICE.address.city,
      addressRegion: HEAD_OFFICE.address.province,
      addressCountry: "ZA",
    },
    location: OFFICES.map((office) => {
      const place: Record<string, unknown> = {
        "@type": "Place",
        name: office.publicLabel,
        telephone: phoneTel,
      };

      if ("address" in office && office.address) {
        place.address = {
          "@type": "PostalAddress",
          addressLocality: office.address.city,
          addressRegion: office.address.province,
          addressCountry: "ZA",
        };
      } else {
        place.address = {
          "@type": "PostalAddress",
          addressRegion: "Western Cape",
          addressCountry: "ZA",
        };
      }

      return place;
    }),
    knowsAbout: [
      "Dam linings",
      "HDPE dam lining",
      "PVC dam lining",
      "Bitumen waterproofing",
      "Steel water tanks",
      "Leaking dam repair",
      "Reservoir lining",
    ],
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.domain}/#website`,
    name: siteConfig.name,
    alternateName: "Damtech South Africa",
    url: siteConfig.domain,
    description: siteConfig.defaultDescription,
    publisher: {
      "@id": `${siteConfig.domain}/#organization`,
    },
    inLanguage: "en-ZA",
  };
}

export function createOfficeLocalBusinessSchemas(
  options: {
    /** Limit to a single office id, or omit for both offices. */
    officeIds?: readonly string[];
    areaServedOverride?: string;
  } = {},
) {
  const { officeIds, areaServedOverride } = options;
  const offices = officeIds
    ? OFFICES.filter((office) => officeIds.includes(office.id))
    : [...OFFICES];

  return offices.map((office) => {
    const areaServed =
      areaServedOverride ??
      (office.id === "western-cape" ? "Western Cape" : "South Africa");

    return {
      "@context": "https://schema.org",
      "@type": "HomeAndConstructionBusiness",
      "@id": `${siteConfig.domain}/#office-${office.id}`,
      name: `${siteConfig.name} — ${office.name}`,
      url: siteConfig.domain,
      telephone: phoneTel,
      email: siteConfig.email,
      image: absoluteAssetUrl(IMAGE_PATHS.damtechLogo),
      parentOrganization: {
        "@id": `${siteConfig.domain}/#organization`,
      },
      areaServed,
      // Service-area business: no street address in public schema.
      address: {
        "@type": "PostalAddress",
        addressLocality: office.address.city,
        addressRegion: office.address.province,
        addressCountry: "ZA",
      },
    };
  });
}

export function createServiceSchema({
  name,
  description,
  path,
  serviceType,
  offers,
  areaServed = siteConfig.location,
}: {
  name: string;
  description: string;
  path: string;
  /** Schema.org `serviceType` — defaults to `name`. */
  serviceType?: string;
  /** Offer names for `hasOfferCatalog.itemListElement`. */
  offers?: readonly string[];
  areaServed?: string;
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
      "@type": "Organization",
      "@id": `${siteConfig.domain}/#organization`,
      name: siteConfig.name,
      url: siteConfig.domain,
      telephone: siteConfig.phone || undefined,
    },
    areaServed,
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
      "@type": "Person",
      name: BLOG_AUTHOR.name,
      jobTitle: BLOG_AUTHOR.role,
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

export function createProjectCaseStudySchema(project: {
  title: string;
  description: string;
  path: string;
  location: string;
  serviceType: string;
  images?: ReadonlyArray<{ src: string; alt: string }>;
}) {
  const primaryImage = project.images?.[0];

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${absoluteUrl(project.path)}#project`,
    name: project.title,
    description: project.description,
    url: absoluteUrl(project.path),
    about: project.serviceType,
    inLanguage: "en-ZA",
    contentLocation: {
      "@type": "Place",
      name: project.location,
      address: {
        "@type": "PostalAddress",
        addressCountry: "ZA",
      },
    },
    ...(primaryImage
      ? {
          image: {
            "@type": "ImageObject",
            url: absoluteAssetUrl(primaryImage.src),
            caption: primaryImage.alt,
          },
        }
      : {}),
    provider: {
      "@id": `${siteConfig.domain}/#localbusiness`,
    },
    creator: {
      "@id": `${siteConfig.domain}/#organization`,
    },
  };
}

type CatalogueProductSchemaInput = {
  name: string;
  description: string;
  path: string;
  sku: string;
  priceInclVatZar: string;
  imageUrl?: string;
  imageUrls?: readonly string[];
  brandName?: string;
  availability?: string;
};

function createProductOffer(input: {
  url: string;
  priceInclVatZar: string;
  availability?: string;
}): Record<string, unknown> {
  return {
    "@type": "Offer",
    url: input.url,
    priceCurrency: "ZAR",
    price: input.priceInclVatZar,
    validFrom: PRODUCT_PRICE_VALID_FROM,
    priceValidUntil: PRODUCT_PRICE_VALID_UNTIL,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: input.priceInclVatZar,
      priceCurrency: "ZAR",
      valueAddedTaxIncluded: true,
    },
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@id": `${siteConfig.domain}/#organization`,
    },
    availability:
      input.availability ??
      merchantAvailabilityToSchemaUrl(CATALOGUE_MERCHANT_AVAILABILITY),
    hasMerchantReturnPolicy: createOfferMerchantReturnPolicy(),
    shippingDetails: createOfferShippingDetails(),
  };
}

function createProductNode(input: CatalogueProductSchemaInput): Record<string, unknown> {
  const url = absoluteUrl(input.path);
  const schema: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${url}#product`,
    name: input.name,
    description: input.description,
    sku: input.sku,
    mpn: input.sku,
    url,
    brand: {
      "@type": "Brand",
      name: input.brandName ?? siteConfig.name,
    },
    manufacturer: {
      "@id": `${siteConfig.domain}/#organization`,
      name: siteConfig.name,
    },
    offers: createProductOffer({
      url,
      priceInclVatZar: input.priceInclVatZar,
      availability: input.availability,
    }),
  };

  const imageUrls = [
    ...(input.imageUrls ?? []),
    ...(input.imageUrl ? [input.imageUrl] : []),
  ].filter((imageUrl, index, list) => list.indexOf(imageUrl) === index);
  if (imageUrls.length > 0) {
    schema.image = imageUrls.map((imageUrl) => absoluteAssetUrl(imageUrl));
  }

  return schema;
}

export function createProductSchema(
  input: CatalogueProductSchemaInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    ...createProductNode(input),
  };
}

export type ItemListSchemaItem = {
  name: string;
  path: string;
  imageUrl?: string;
} & (
  | {
      priceInclVatZar?: undefined;
      description?: undefined;
      sku?: undefined;
    }
  | {
      /** When set, the list item carries a Product with this VAT-inclusive offer price. */
      priceInclVatZar: string;
      description: string;
      sku: string;
      imageUrls?: readonly string[];
      availability?: string;
      brandName?: string;
    }
);

export function createItemListSchema(
  items: ReadonlyArray<ItemListSchemaItem>,
  listName: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => {
      if (!item.priceInclVatZar) {
        return {
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: absoluteUrl(item.path),
        };
      }
      return {
        "@type": "ListItem",
        position: index + 1,
        item: createProductNode({
          name: item.name,
          description: item.description,
          path: item.path,
          sku: item.sku,
          priceInclVatZar: item.priceInclVatZar,
          imageUrl: item.imageUrl,
          imageUrls: item.imageUrls,
          availability: item.availability,
          brandName: item.brandName,
        }),
      };
    }),
  };
}
