import { UNRESOLVED_BUSINESS_FACTS } from "./unresolved.ts";
import {
  isUnresolvedFact,
  type CatalogueSku,
  type UnresolvedBusinessFact,
} from "./types.ts";

export const MIN_GOOGLE_IMAGE_PX = 500;
export const PREFERRED_MAIN_IMAGE_PX = 1500;
export const MAX_GOOGLE_IMAGE_BYTES = 16 * 1024 * 1024;
export const PRODUCT_GALLERY_ASPECT = "1 / 1" as const;
/** Product JSON-LD and sitemaps must use the original static WebP, never /_next/image. */
export const CATALOGUE_IMAGE_ORIGIN = "https://www.dam-tech.co.za" as const;
export const DIGITAL_SOURCE_TYPE =
  "http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia";

export type ImageMimeType = "image/webp" | "image/jpeg" | "image/png";
export type CatalogueImageRole = "main" | "additional" | "lifestyle";
export type CatalogueImageOrigin = "photography" | "synthetic-composite";

export type CatalogueImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  mimeType: ImageMimeType;
  caption?: string;
  role: CatalogueImageRole;
  representative: boolean;
  /** Eligible for Product.image JSON-LD. Independent of Merchant feed eligibility. */
  schemaEligible: boolean;
  merchantEligible: false;
  origin: CatalogueImageOrigin;
};

export type PlannedProductImage = {
  filename: string;
  publicPath: string;
  alt: string;
  present: boolean;
};

export type ProductImageManifest = {
  plannedMain: PlannedProductImage;
  main: CatalogueImageAsset | UnresolvedBusinessFact;
  additional: readonly CatalogueImageAsset[];
  lifestyle: readonly CatalogueImageAsset[];
  ogImage: CatalogueImageAsset | UnresolvedBusinessFact;
  merchantEligible: false;
};

export const PLANNED_MAIN_IMAGES: Record<CatalogueSku, Omit<PlannedProductImage, "present">> =
  {
    "DMT-WT-10000": {
      filename: "damtech-10000l-corrugated-steel-water-tank-south-africa.webp",
      publicPath:
        "/images/damtech-10000l-corrugated-steel-water-tank-south-africa.webp",
      alt: "10 000L corrugated steel water tank supply-only kit by Damtech",
    },
    "DMT-WT-20000": {
      filename: "damtech-20000l-corrugated-steel-water-tank-south-africa.webp",
      publicPath:
        "/images/damtech-20000l-corrugated-steel-water-tank-south-africa.webp",
      alt: "20 000L corrugated steel water tank for farm water storage",
    },
    "DMT-WT-50000": {
      filename: "damtech-50000l-corrugated-steel-water-tank-south-africa.webp",
      publicPath:
        "/images/damtech-50000l-corrugated-steel-water-tank-south-africa.webp",
      alt: "50 000L corrugated steel water reservoir kit by Damtech",
    },
    "DMT-WT-100000": {
      filename: "damtech-100000l-corrugated-steel-water-tank-south-africa.webp",
      publicPath:
        "/images/damtech-100000l-corrugated-steel-water-tank-south-africa.webp",
      alt: "100 000L corrugated steel water tank for bulk storage",
    },
    "DMT-FP-10000": {
      filename: "damtech-10000l-fish-pond-aquaculture-tank-south-africa.webp",
      publicPath:
        "/images/damtech-10000l-fish-pond-aquaculture-tank-south-africa.webp",
      alt: "10 000L corrugated steel fish pond and aquaculture tank kit",
    },
    "DMT-FP-15000": {
      filename: "damtech-15000l-fish-pond-aquaculture-tank-south-africa.webp",
      publicPath:
        "/images/damtech-15000l-fish-pond-aquaculture-tank-south-africa.webp",
      alt: "15 000L corrugated steel fish-farming pond kit",
    },
    "DMT-LT-1500": {
      filename: "damtech-round-livestock-cattle-water-trough-south-africa.webp",
      publicPath:
        "/images/damtech-round-livestock-cattle-water-trough-south-africa.webp",
      alt: "Round livestock water trough for cattle on a South African farm",
    },
  };

const SUPPLIED_SQUARE = { width: 1254, height: 1254 } as const;

const SHARED_IMAGE = {
  ...SUPPLIED_SQUARE,
  mimeType: "image/webp" as const,
  representative: true,
  schemaEligible: true,
  merchantEligible: false as const,
  origin: "synthetic-composite" as const,
};

const RESERVOIR_PRIMARY_CAPTION =
  "Interim catalogue image of an open corrugated steel reservoir with liner. Photographed proportions are not an exact scale representation of every listed tank capacity.";

const RESERVOIR_LIFESTYLE_CAPTION =
  "Open corrugated steel reservoir in a farm setting. Shared lifestyle image for the open-top tank kits; not a measured pack shot of a listed diameter or height.";

const SHALLOW_SHARED_CAPTION =
  "Shared shallow corrugated-steel basin image. The galvanised safety crossbar shown is an illustrative optional safety feature and is not confirmed as included in the fixed-price kit.";

const TROUGH_PRIMARY_CAPTION =
  "Round galvanised livestock water trough with liner. Listed size is 1.5 m diameter × 381 mm high. The galvanised safety crossbar shown is an illustrative optional safety feature and is not confirmed as included in the fixed-price kit.";

const SHALLOW_LIFESTYLE_CAPTION =
  "Shallow corrugated steel basin in a farm setting. Shared lifestyle image for the fish-pond and livestock-trough kits. The safety crossbar, where visible, is illustrative and not a confirmed kit inclusion.";

/** White-background open reservoir. Primary image for all four open tank SKUs. */
export const RESERVOIR_PRIMARY_IMAGE: CatalogueImageAsset = {
  src: "/images/corrugated-steel-water-reservoir-south-africa-nobg.webp",
  alt: "Corrugated galvanised steel water reservoir with reinforced PVC liner",
  caption: RESERVOIR_PRIMARY_CAPTION,
  role: "main",
  ...SHARED_IMAGE,
};

/** Farm-setting open reservoir. Lifestyle image for all four open tank SKUs. */
export const RESERVOIR_LIFESTYLE_IMAGE: CatalogueImageAsset = {
  src: "/images/corrugated-steel-water-reservoir-south-africa.webp",
  alt: "Corrugated steel water reservoir installed on a South African farm",
  caption: RESERVOIR_LIFESTYLE_CAPTION,
  role: "lifestyle",
  ...SHARED_IMAGE,
};

/** White-background shallow basin with water and safety crossbar. */
export const SHALLOW_BASIN_PRIMARY_IMAGE: CatalogueImageAsset = {
  src: "/images/galvanised-livestock-water-trough-south-africa-nobg.webp",
  alt: "Shallow corrugated steel fish pond with reinforced PVC liner",
  caption: SHALLOW_SHARED_CAPTION,
  role: "main",
  ...SHARED_IMAGE,
};

export const TROUGH_PRIMARY_IMAGE: CatalogueImageAsset = {
  ...SHALLOW_BASIN_PRIMARY_IMAGE,
  alt: "Round galvanised livestock water trough with PVC liner and safety crossbar",
  caption: TROUGH_PRIMARY_CAPTION,
};

/** Farm-setting shallow basin. Lifestyle for ponds and trough. */
export const SHALLOW_BASIN_LIFESTYLE_IMAGE: CatalogueImageAsset = {
  src: "/images/galvanised-livestock-water-trough-south-africa.webp",
  alt: "Shallow corrugated steel water basin installed in a South African farm setting",
  caption: SHALLOW_LIFESTYLE_CAPTION,
  role: "lifestyle",
  ...SHARED_IMAGE,
};

/**
 * Roofed domestic tank images. Not attached to any current SKU: no catalogue
 * product includes a galvanised conical roof in the advertised kit price.
 */
export const UNUSED_DOMESTIC_ROOFED_PRIMARY: CatalogueImageAsset = {
  src: "/images/10000l-galvanised-steel-water-tank-south-africa-nobg.webp",
  alt: "Domestic corrugated steel water tank with galvanised conical roof",
  role: "main",
  ...SHARED_IMAGE,
};

export const UNUSED_DOMESTIC_ROOFED_LIFESTYLE: CatalogueImageAsset = {
  src: "/images/10000l-galvanised-steel-water-tank-south-africa.webp",
  alt: "Roofed corrugated steel water tank installed in a residential garden",
  role: "lifestyle",
  ...SHARED_IMAGE,
};

export function waterTankImageManifest(sku: CatalogueSku): ProductImageManifest {
  return createImageManifest({
    sku,
    main: RESERVOIR_PRIMARY_IMAGE,
    lifestyle: [RESERVOIR_LIFESTYLE_IMAGE],
    plannedPresent: false,
  });
}

export function fishPondImageManifest(sku: CatalogueSku): ProductImageManifest {
  return createImageManifest({
    sku,
    main: SHALLOW_BASIN_PRIMARY_IMAGE,
    lifestyle: [SHALLOW_BASIN_LIFESTYLE_IMAGE],
    plannedPresent: false,
  });
}

export function livestockTroughImageManifest(): ProductImageManifest {
  return createImageManifest({
    sku: "DMT-LT-1500",
    main: TROUGH_PRIMARY_IMAGE,
    lifestyle: [SHALLOW_BASIN_LIFESTYLE_IMAGE],
    plannedPresent: false,
  });
}

export function plannedMainImage(sku: CatalogueSku): PlannedProductImage {
  const planned = PLANNED_MAIN_IMAGES[sku];
  return { ...planned, present: false };
}

export function createImageManifest(input: {
  sku: CatalogueSku;
  main?: CatalogueImageAsset | UnresolvedBusinessFact;
  additional?: readonly CatalogueImageAsset[];
  lifestyle?: readonly CatalogueImageAsset[];
  plannedPresent?: boolean;
}): ProductImageManifest {
  const planned = {
    ...PLANNED_MAIN_IMAGES[input.sku],
    present: Boolean(input.plannedPresent),
  };
  const main = input.main ?? UNRESOLVED_BUSINESS_FACTS.productSpecificImages;
  const additional = input.additional ?? [];
  const lifestyle = input.lifestyle ?? [];
  const ogImage =
    lifestyle[0] ??
    (!isUnresolvedFact(main) ? main : UNRESOLVED_BUSINESS_FACTS.productSpecificImages);

  return {
    plannedMain: planned,
    main,
    additional,
    lifestyle,
    ogImage,
    merchantEligible: false,
  };
}

export function getPageGalleryImages(
  manifest: ProductImageManifest,
): CatalogueImageAsset[] {
  const images: CatalogueImageAsset[] = [];
  if (!isUnresolvedFact(manifest.main)) images.push(manifest.main);
  images.push(...manifest.additional, ...manifest.lifestyle);
  const seen = new Set<string>();
  return images.filter((image) => {
    if (seen.has(image.src + image.alt)) return false;
    seen.add(image.src + image.alt);
    return image.width >= MIN_GOOGLE_IMAGE_PX && image.height >= MIN_GOOGLE_IMAGE_PX;
  });
}

/**
 * Product.image URLs. Independent of merchantEligible.
 * White-background primary first, lifestyle second. Canonical static WebP only.
 */
export function getSchemaImageUrls(manifest: ProductImageManifest): string[] {
  return getPageGalleryImages(manifest)
    .filter((image) => image.schemaEligible)
    .map((image) => canonicalProductImageUrl(image.src));
}

export function canonicalProductImageUrl(src: string): string {
  if (/^https?:\/\//i.test(src)) {
    const url = new URL(src);
    return `${CATALOGUE_IMAGE_ORIGIN}${url.pathname}`;
  }
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${CATALOGUE_IMAGE_ORIGIN}${path}`;
}

export function getOgImageAsset(
  manifest: ProductImageManifest,
): CatalogueImageAsset | undefined {
  if (!isUnresolvedFact(manifest.ogImage)) return manifest.ogImage;
  if (!isUnresolvedFact(manifest.main) && manifest.main.schemaEligible) {
    return manifest.main;
  }
  return undefined;
}

export function meetsGoogleMainImageSize(image: CatalogueImageAsset): boolean {
  return (
    image.width >= MIN_GOOGLE_IMAGE_PX &&
    image.height >= MIN_GOOGLE_IMAGE_PX &&
    image.width * image.height <= 64_000_000
  );
}
