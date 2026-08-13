"use client";

import Image from "next/image";
import Link from "next/link";
import {
  buildCatalogueAnalyticsItem,
  CATALOGUE_ANALYTICS_EVENTS,
} from "@/lib/catalogue/analytics";
import {
  catalogueProductUrlPath,
  formatZarWholeInclVat,
  getPageGalleryImages,
  PRODUCT_GALLERY_ASPECT,
  type CatalogueProduct,
} from "@/lib/catalogue";
import { pushCatalogueAnalytics } from "./pushCatalogueAnalytics";

export function CatalogueProductCard({ product }: { product: CatalogueProduct }) {
  const href = `${catalogueProductUrlPath(product)}/`;
  const thumb = getPageGalleryImages(product.images)[0];

  function handleSelect() {
    pushCatalogueAnalytics(
      CATALOGUE_ANALYTICS_EVENTS.selectItem,
      buildCatalogueAnalyticsItem(product, 1),
    );
  }

  return (
    <article className="catalogue-card">
      {thumb ? (
        <div
          className="catalogue-card__media"
          style={{ aspectRatio: PRODUCT_GALLERY_ASPECT }}
        >
          <Image
            src={thumb.src}
            alt={thumb.alt}
            width={thumb.width}
            height={thumb.height}
            className="catalogue-card__image"
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
            quality={75}
          />
        </div>
      ) : (
        <div
          className="catalogue-card__media catalogue-card__media--empty"
          style={{ aspectRatio: PRODUCT_GALLERY_ASPECT }}
          aria-hidden
        />
      )}
      <div className="catalogue-card__body">
        <h3 className="catalogue-card__title">
          <Link href={href} onClick={handleSelect}>
            {product.name}
          </Link>
        </h3>
        <p className="catalogue-card__price">{formatZarWholeInclVat(product.priceInclVatZar)}</p>
        <p className="catalogue-card__spec">{product.coreSpecSummary}</p>
        <ul className="catalogue-card__flags">
          <li>Supply-only kit</li>
          <li>Transport and installation excluded</li>
        </ul>
      </div>
      <Link
        href={href}
        className="catalogue-card__cta"
        onClick={handleSelect}
      >
        View Product
      </Link>
    </article>
  );
}
