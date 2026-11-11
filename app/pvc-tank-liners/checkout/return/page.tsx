import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SiteSection } from "@/components/SiteSection";
import { formatZarExactAmount } from "@/lib/catalogue/format";
import { fulfilmentLabel, isCollectionMethod } from "@/lib/shop/delivery";
import { isDeliveryChargedSeparately, PVC_LINER_MANUFACTURE_LABEL } from "@/lib/shop/pvc-liners";
import { getPvcOrderForCustomer } from "@/lib/shop/pvc-orders";

export const metadata: Metadata = {
  title: { absolute: "Payment | Damtech" },
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ ref?: string; t?: string }> };

export default async function PvcReturnPage({ searchParams }: PageProps) {
  const { ref = "", t = "" } = await searchParams;
  const order = ref && t ? await getPvcOrderForCustomer(ref.trim(), t.trim()) : null;

  if (!order) {
    return (
      <>
        <Hero
          compact
          eyebrow="Payment"
          title="We could not find this order"
          description="The link may be incomplete."
          showActions={false}
        />
        <SiteSection>
          <p>
            If you paid, PayFast has emailed you a receipt and we will email your order confirmation. Questions? Call
            +27 82 853 1026 or email info@dam-tech.co.za.
          </p>
        </SiteSection>
      </>
    );
  }

  const paid = order.paymentStatus === "paid";
  const collecting = isCollectionMethod(order.fulfilmentMethod);
  return (
    <>
      <Hero
        compact
        eyebrow={`Order ${order.orderReference}`}
        title={paid ? "Payment received, thank you" : "We are confirming your payment"}
        description={
          paid
            ? `${PVC_LINER_MANUFACTURE_LABEL}. ${collecting ? "We will call you with the collection address and time." : "We will call you to arrange delivery."}`
            : "PayFast usually confirms within a minute. Refresh this page shortly. You will also get an email once it is confirmed."
        }
        showActions={false}
      />
      <SiteSection>
        <dl className="pvc-shop__receipt">
          <div>
            <dt>Product</dt>
            <dd>
              {order.quantity} × {order.productName}
            </dd>
          </div>
          <div>
            <dt>{collecting ? "Collection" : "Delivery to"}</dt>
            <dd>{collecting ? fulfilmentLabel(order.fulfilmentMethod, order.province).replace("Collection in ", "") : order.province}</dd>
          </div>
          {!collecting && isDeliveryChargedSeparately(order.fulfilmentMethod, order.deliveryFeeZar) ? (
            <div>
              <dt>Delivery cost</dt>
              <dd>Charged separately. We send you the cost before dispatch.</dd>
            </div>
          ) : null}
          <div>
            <dt>{paid ? "Paid" : "Amount"}</dt>
            <dd>{formatZarExactAmount(order.amountPaidZar ?? order.amountDueZar)} incl. VAT</dd>
          </div>
          <div>
            <dt>Confirmation email</dt>
            <dd>{order.email}</dd>
          </div>
        </dl>
        <p>
          <Link href="/" className="btn-primary">
            Back to the home page
          </Link>
        </p>
      </SiteSection>
    </>
  );
}
