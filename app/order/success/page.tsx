import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SiteSection } from "@/components/SiteSection";
import { formatZarWholeInclVat } from "@/lib/catalogue";
import { getOrderByPublicConfirmation } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Order placed | Damtech",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams: Promise<{ ref?: string; token?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderReference = params.ref?.trim() || "";
  const viewToken = params.token?.trim() || "";
  const order =
    orderReference && viewToken && viewToken !== "spam"
      ? await getOrderByPublicConfirmation({
          orderReference,
          viewToken,
        })
      : null;

  return (
    <>
      <Hero
        compact
        eyebrow="Pending invoice"
        title="Your order has been placed"
        description="Your order has been recorded. DamTech will send the formal invoice separately. This is not a payment confirmation."
      />
      <SiteSection>
        <p>
          Please keep your order reference for future correspondence.
        </p>
        <dl className="order-success__list">
          <div>
            <dt>Order reference</dt>
            <dd>
              <strong>{order?.orderReference || orderReference || "—"}</strong>
            </dd>
          </div>
          {order ? (
            <>
              <div>
                <dt>Product</dt>
                <dd>{order.productName}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{order.quantity}</dd>
              </div>
              <div>
                <dt>Total including VAT</dt>
                <dd>{formatZarWholeInclVat(order.totalInclVatZar)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Pending invoice</dd>
              </div>
              <div>
                <dt>Customer email</dt>
                <dd>{order.email}</dd>
              </div>
            </>
          ) : null}
        </dl>
        <p>
          The invoice will follow separately by email. Only make payment using
          the banking details shown on the official DamTech invoice.
        </p>
        <p>
          <Link href="/steel-water-storage-tanks/">Return to the catalogue</Link>
          {" · "}
          <Link href="/contact/">Contact DamTech</Link>
        </p>
      </SiteSection>
    </>
  );
}
