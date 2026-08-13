import Image from "next/image";
import {
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
  return (
    <span className="order-money">{value}</span>
  );
}

export function OrderSummary({
  snapshot,
  sticky = false,
}: {
  snapshot: OrderPriceSnapshot;
  sticky?: boolean;
}) {
  const image = getPageGalleryImages(snapshot.product.images)[0];
  const vatLabel = `Included VAT (${snapshot.vatRatePercent}%)`;
  const totalLabel = `Total ${formatZarWholeAmount(snapshot.totalInclVatZar)}, VAT included`;

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
        </div>
      </div>

      <section className="order-summary__block" aria-labelledby="order-summary-details">
        <h3 id="order-summary-details" className="order-summary__block-title">
          Product details
        </h3>
        <dl className="order-summary__rows">
          <div>
            <dt>Dimensions / capacity</dt>
            <dd>{snapshot.coreSpecSummary}</dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd>{snapshot.quantity}</dd>
          </div>
        </dl>
      </section>

      <section className="order-summary__block" aria-labelledby="order-summary-price">
        <h3 id="order-summary-price" className="order-summary__block-title">
          Price breakdown
        </h3>
        <dl className="order-summary__rows">
          <div>
            <dt>Unit price</dt>
            <dd>
              <Money amount={snapshot.unitPriceInclVatZar} />
            </dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd className="order-money">× {snapshot.quantity}</dd>
          </div>
          <div>
            <dt>Product total</dt>
            <dd>
              <Money amount={snapshot.totalInclVatZar} />
            </dd>
          </div>
          <div>
            <dt>{vatLabel}</dt>
            <dd>
              <Money amount={snapshot.vatAmountZar} whole={false} />
            </dd>
          </div>
        </dl>
      </section>

      <div className="order-summary__total-panel" aria-label={totalLabel}>
        <p className="order-summary__total-label">Total</p>
        <p className="order-summary__total-value">
          <Money amount={snapshot.totalInclVatZar} />
        </p>
        <p className="order-summary__total-note">VAT included</p>
      </div>

      <section className="order-summary__notice" aria-labelledby="order-summary-supply">
        <h3 id="order-summary-supply" className="order-summary__block-title">
          Supply-only kit
        </h3>
        <p>Transport and installation are not included.</p>
      </section>

      <dl className="order-summary__rows order-summary__meta">
        <div>
          <dt>Fulfilment</dt>
          <dd>Collection or own transport</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>Invoice</dd>
        </div>
      </dl>
    </aside>
  );
}
