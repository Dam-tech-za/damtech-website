"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildCatalogueAnalyticsItem,
  CATALOGUE_ANALYTICS_EVENTS,
} from "@/lib/catalogue/analytics";
import {
  formatZarWholeInclVat,
  invoiceRequestPath,
  orderPath,
  parseCatalogueQuantity,
  type CatalogueProduct,
} from "@/lib/catalogue";
import { pushCatalogueAnalytics } from "./pushCatalogueAnalytics";

export function AddToRfqControl({ product }: { product: CatalogueProduct }) {
  const [quantity, setQuantity] = useState(1);
  const lineTotal = useMemo(
    () => product.priceInclVatZar * quantity,
    [product.priceInclVatZar, quantity],
  );
  const checkoutHref = orderPath(product.sku, quantity);
  const quoteHref = invoiceRequestPath(product.sku, quantity);

  function handleBeginCheckout() {
    pushCatalogueAnalytics(
      CATALOGUE_ANALYTICS_EVENTS.beginCheckout,
      buildCatalogueAnalyticsItem(product, quantity),
    );
  }

  function handleCustomQuote() {
    pushCatalogueAnalytics(
      CATALOGUE_ANALYTICS_EVENTS.addToRfq,
      buildCatalogueAnalyticsItem(product, quantity),
    );
  }

  return (
    <div id={`request-invoice-${product.sku}`} className="catalogue-buybox">
      <p className="catalogue-buybox__price">
        {formatZarWholeInclVat(product.priceInclVatZar)}
      </p>
      <p className="catalogue-buybox__notice">{product.supplyNotice}</p>
      <p className="catalogue-buybox__meta">VAT included · Supply-only kit</p>
      <p className="catalogue-buybox__meta">
        Transport and installation excluded
      </p>
      <p className="catalogue-buybox__availability">{product.publicAvailability}</p>
      <div className="catalogue-buybox__qty">
        <label htmlFor={`qty-${product.sku}`} className="form-label">
          Quantity
        </label>
        <input
          id={`qty-${product.sku}`}
          name="qty"
          type="number"
          min={1}
          max={99}
          step={1}
          value={quantity}
          onChange={(event) =>
            setQuantity(parseCatalogueQuantity(event.target.value))
          }
          className="form-input catalogue-buybox__qty-input"
        />
      </div>
      <p className="catalogue-buybox__line">
        Line total: {formatZarWholeInclVat(lineTotal)}
      </p>
      <Link
        href={checkoutHref}
        className="btn-primary catalogue-cta"
        onClick={handleBeginCheckout}
      >
        Order this kit
      </Link>
      <Link
        href={quoteHref}
        className="btn-secondary catalogue-cta"
        onClick={handleCustomQuote}
      >
        Request a custom quote
      </Link>
      <p className="catalogue-buybox__help">
        <strong>Order this kit</strong> buys the standard fixed-price supply-only
        product for collection or customer-arranged transport.{" "}
        <strong>Request a custom quote</strong> is for installation, modified
        fittings, Damtech-arranged transport or other non-standard work.
      </p>
    </div>
  );
}
