"use client";

import { useMemo, useState } from "react";
import {
  formatZarInclVat,
  parseCatalogueQuantity,
  type CatalogueLineSnapshot,
} from "@/lib/catalogue";

export function RfqProductSummary({ line }: { line: CatalogueLineSnapshot }) {
  const [quantity, setQuantity] = useState(line.quantity);
  const lineTotal = useMemo(
    () => line.unitPriceInclVatZar * quantity,
    [line.unitPriceInclVatZar, quantity],
  );

  return (
    <section className="rfq-product-summary" aria-labelledby="rfq-product-summary-heading">
      <h2 id="rfq-product-summary-heading" className="section-heading !mt-0">
        Invoice request summary
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Add this fixed-price supply-only kit to your RFQ. Damtech will confirm
        transport and send an invoice. You can change quantity; the unit price
        comes from the Damtech catalogue and cannot be edited.
      </p>
      <input type="hidden" name="sku" value={line.sku} />
      <dl className="rfq-product-summary__list">
        <div>
          <dt>Product</dt>
          <dd>{line.productName}</dd>
        </div>
        <div>
          <dt>SKU</dt>
          <dd>{line.sku}</dd>
        </div>
        <div>
          <dt>Unit price including VAT</dt>
          <dd>{formatZarInclVat(line.unitPriceInclVatZar)}</dd>
        </div>
        <div>
          <dt>
            <label htmlFor="rfq-catalogue-qty">Quantity</label>
          </dt>
          <dd>
            <input
              id="rfq-catalogue-qty"
              name="quantity"
              type="number"
              min={1}
              max={99}
              step={1}
              value={quantity}
              onChange={(event) =>
                setQuantity(parseCatalogueQuantity(event.target.value))
              }
              className="form-input rfq-product-summary__qty"
            />
          </dd>
        </div>
        <div>
          <dt>Line total including VAT</dt>
          <dd>{formatZarInclVat(lineTotal)}</dd>
        </div>
        <div>
          <dt>Transport</dt>
          <dd>Excluded</dd>
        </div>
        <div>
          <dt>Installation</dt>
          <dd>Excluded</dd>
        </div>
      </dl>
    </section>
  );
}
