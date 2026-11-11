import { CANONICAL_ORIGIN } from "../site-url.ts";
import {
  isPvcLinerSoldOnline,
  PVC_LINERS,
  PVC_LINER_COLOUR_IMAGES,
  PVC_LINER_COLOURS,
  PVC_LINER_DEFAULT_COLOUR,
  PVC_LINER_PAGE_PATH,
  pvcLinerProductPath,
  pvcLinerProductTitle,
  pvcLinerSizeLabel,
  type PvcLiner,
} from "./pvc-liners.ts";

/**
 * Google visibility for the PVC liner variants.
 *
 * Every liner has its own product page (`/pvc-tank-liners/{sku}/`) showing that
 * liner's exact VAT-inclusive price, so the price Google reads always matches
 * the page. Colour (blue/black) does not change the
 * price, so it is not a separate Merchant variant; the blue illustration is
 * the listing image. Set to null to withdraw the liners from the feed.
 */
export const PVC_LINER_MERCHANT_IMAGE: { src: string; alt: string } | null =
  PVC_LINER_COLOUR_IMAGES[PVC_LINER_DEFAULT_COLOUR];

/** Merchant Center shipping label; per-province rates are set on this label. */
export const PVC_LINER_SHIPPING_LABEL = "pvc-tank-liner";

export const PVC_LINER_HANDLING_DAYS = { min: 3, max: 5 } as const;
export const PVC_LINER_TRANSIT_DAYS = { min: 3, max: 5 } as const;

/** Google product taxonomy 1910: Hardware > Storage Tanks (closest verified fit). */
const GOOGLE_CATEGORY_STORAGE_TANKS = "1910";

export function pvcLinerVariantPath(liner: PvcLiner): string {
  return pvcLinerProductPath(liner);
}

export function pvcLinerVariantUrl(liner: PvcLiner): string {
  return `${CANONICAL_ORIGIN}${pvcLinerVariantPath(liner)}`;
}

const sizeLabel = pvcLinerSizeLabel;

export const pvcLinerFeedTitle = pvcLinerProductTitle;

function schemaImages(): string[] {
  return PVC_LINER_COLOURS.map((colour) => `${CANONICAL_ORIGIN}${PVC_LINER_COLOUR_IMAGES[colour].src}`);
}

function productNode(liner: PvcLiner): Record<string, unknown> {
  return {
    "@type": "Product",
    sku: liner.sku,
    mpn: liner.sku,
    name: pvcLinerFeedTitle(liner),
    description: liner.summary,
    size: sizeLabel(liner),
    material: `${liner.gsm} gsm PVC`,
    color: "Blue or black",
    brand: { "@type": "Brand", name: "DamTech" },
    image: schemaImages(),
    offers: {
      "@type": "Offer",
      url: pvcLinerVariantUrl(liner),
      priceCurrency: "ZAR",
      price: liner.priceInclVatZar.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

/** Liners sold online; larger ones are quote-only and carry no offer. */
const ONLINE_LINERS = PVC_LINERS.filter(isPvcLinerSoldOnline);

/** schema.org Product for one liner's own product page (null for quote-only sizes). */
export function buildPvcLinerProductSchema(liner: PvcLiner): Record<string, unknown> | null {
  if (!isPvcLinerSoldOnline(liner)) return null;
  return {
    "@context": "https://schema.org",
    ...productNode(liner),
    "@id": `${pvcLinerVariantUrl(liner)}#product`,
    url: pvcLinerVariantUrl(liner),
    inProductGroupWithID: "DMT-PVC",
  };
}

/** schema.org ProductGroup with one Product per liner. */
export function buildPvcLinerProductGroupSchema(): Record<string, unknown> {
  const image = PVC_LINER_MERCHANT_IMAGE ? `${CANONICAL_ORIGIN}${PVC_LINER_MERCHANT_IMAGE.src}` : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "@id": `${CANONICAL_ORIGIN}${PVC_LINER_PAGE_PATH}#product`,
    productGroupID: "DMT-PVC",
    name: "PVC tank liner for corrugated steel water tanks",
    description:
      "Made-to-order PVC liner (550 gsm or 800 gsm) for corrugated steel water tanks from 3 m to 17 m diameter. Floor, walls and a 300 mm fold-over.",
    brand: { "@type": "Brand", name: "DamTech" },
    url: `${CANONICAL_ORIGIN}${PVC_LINER_PAGE_PATH}`,
    ...(image ? { image } : {}),
    variesBy: ["https://schema.org/size", "https://schema.org/material"],
    hasVariant: ONLINE_LINERS.map(productNode),
  };
}

export type PvcLinerFeedRow = {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_link: string;
  availability: string;
  availability_date: string;
  price: string;
  condition: string;
  brand: string;
  mpn: string;
  identifier_exists: string;
  google_product_category: string;
  product_type: string;
  min_handling_time: string;
  max_handling_time: string;
  min_transit_time: string;
  max_transit_time: string;
  ships_from_country: string;
  item_group_id: string;
  size: string;
  material: string;
  shipping_label: string;
};

/** Merchant feed rows for every liner, or none until an approved image exists. */
export function buildPvcLinerFeedRows(
  image: { src: string } | null = PVC_LINER_MERCHANT_IMAGE,
): PvcLinerFeedRow[] {
  if (!image) return [];
  return ONLINE_LINERS.map((liner) => ({
    id: liner.sku,
    title: pvcLinerFeedTitle(liner),
    description: `${liner.summary} Made to order in 3 to 5 business days, then delivered in South Africa. Installation not included.`,
    link: pvcLinerVariantUrl(liner),
    image_link: `${CANONICAL_ORIGIN}${image.src}`,
    additional_image_link: `${CANONICAL_ORIGIN}${PVC_LINER_COLOUR_IMAGES.black.src}`,
    availability: "in_stock",
    availability_date: "",
    price: `${liner.priceInclVatZar.toFixed(2)} ZAR`,
    condition: "new",
    brand: "DamTech",
    mpn: liner.sku,
    identifier_exists: "yes",
    google_product_category: GOOGLE_CATEGORY_STORAGE_TANKS,
    product_type: "Water Storage > PVC Tank Liners",
    min_handling_time: String(PVC_LINER_HANDLING_DAYS.min),
    max_handling_time: String(PVC_LINER_HANDLING_DAYS.max),
    min_transit_time: String(PVC_LINER_TRANSIT_DAYS.min),
    max_transit_time: String(PVC_LINER_TRANSIT_DAYS.max),
    ships_from_country: "ZA",
    item_group_id: "DMT-PVC",
    size: sizeLabel(liner),
    material: `${liner.gsm} gsm PVC`,
    shipping_label: PVC_LINER_SHIPPING_LABEL,
  }));
}
