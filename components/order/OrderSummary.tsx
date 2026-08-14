import Image from "next/image";
import {
  catalogueDeliveryLeadTimeLabel,
  catalogueManufacturingLeadTimeLabel,
  catalogueTotalFulfilmentLeadTimeLabel,
  formatZarExactAmount,
  formatZarWholeAmount,
  getPageGalleryImages,
} from "@/lib/catalogue";
import type { OrderPriceSnapshot } from "@/lib/orders/pricing";

function Money({
  amount,
  whole = true,
}: {
  amount: number;
  whole?: boolean;
}) {
  const value = whole ? formatZarWholeAmount(amount) : formatZarExactAmount(amount);
  return <span className="order-money">{value}</span>;
}

export function OrderSummary({
  snapshot,
  sticky = false,
}: {
  snapshot: OrderPriceSnapshot;
  sticky?: boolean;
}) {
  const image = getPageGalleryImages(snapshot.product.images)[0];
  const totalLabel = `Order total ${formatZarWholeAmount(snapshot.totalInclVatZar)} incl. VAT`;

  return (
    <aside
      className={sticky ? "order-summary order-summary--sticky" : "order-summary"}
      aria-labelledby="order-summary-heading"
    >
      <h2 id="order-summary-heading" className="order-summary__heading">
        Order summary
      </h2>

      <div className="order-summary__product">
        {image ? (
          <div className="order-summary__thumb">
            <Image
              src={image.src}
              alt={image.alt}
              width={80}
              height={80}
              sizes="80px"
            />
          </div>
        ) : null}
        <div className="order-summary__product-copy">
          <p className="order-summary__name">{snapshot.productName}</p>
          <p className="order-summary__sku">SKU {snapshot.sku}</p>
          <p className="order-summary__spec">{snapshot.coreSpecSummary}</p>
          <p className="order-summary__qty">Quantity {snapshot.quantity}</p>
        </div>
      </div>

      <section className="order-summary__block" aria-labelledby="order-summary-price">
        <h3 id="order-summary-price" className="order-summary__block-title">
          Price
        </h3>
        <dl className="order-summary__rows">
          <div>
            <dt>Unit price incl. VAT</dt>
            <dd>
              <Money amount={snapshot.unitPriceInclVatZar} />
            </dd>
          </div>
          <div>
            <dt>Included VAT ({snapshot.vatRatePercent}%)</dt>
            <dd>
              <Money amount={snapshot.vatAmountZar} whole={false} />
            </dd>
          </div>
          <div className="order-summary__rows-total">
            <dt>Order total incl. VAT</dt>
            <dd>
              <Money amount={snapshot.totalInclVatZar} />
            </dd>
          </div>
        </dl>
        <p className="order-summary__price-note" aria-label={totalLabel}>
          Delivery and installation are excluded from this total.
        </p>
      </section>

      <section className="order-summary__block" aria-labelledby="order-summary-ordering">
        <h3 id="order-summary-ordering" className="order-summary__block-title">
          What you are ordering
        </h3>
        <ul className="order-summary__list">
          <li>Fixed-price supply-only kit</li>
          <li>Made to order</li>
          <li>Delivery only</li>
          <li>Delivery excluded from displayed product price</li>
          <li>Installation excluded</li>
          <li>Invoice payment</li>
        </ul>
      </section>

      <section className="order-summary__block order-summary__block--last" aria-labelledby="order-summary-timeline">
        <h3 id="order-summary-timeline" className="order-summary__block-title">
          Estimated timeline
        </h3>
        <dl className="order-summary__rows">
          <div>
            <dt>Manufacturing</dt>
            <dd>{catalogueManufacturingLeadTimeLabel()}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{catalogueDeliveryLeadTimeLabel()}</dd>
          </div>
          <div>
            <dt>Total estimate</dt>
            <dd>{catalogueTotalFulfilmentLeadTimeLabel()}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
