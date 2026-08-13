import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SiteSection } from "@/components/SiteSection";
import { OrderForm } from "@/components/order/OrderForm";
import { OrderFormViewAnalytics } from "@/components/order/OrderAnalytics";
import { resolveOrderSelectionFromParams } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Place your order | Damtech",
  description:
    "Order a fixed-price supply-only kit and receive an invoice from DamTech. Payment is made against the invoice after your order has been confirmed.",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const snapshot = resolveOrderSelectionFromParams(params);

  if (!snapshot) {
    return (
      <>
        <Hero
          compact
          eyebrow="Order"
          title="Kit not found"
          description="This order link is not valid. Choose a catalogue kit to continue."
        />
        <SiteSection>
          <p>
            The product could not be loaded from this address. Prices and names
            in the URL are ignored. Use a product page to start an order.
          </p>
          <p>
            <Link href="/steel-water-storage-tanks/" className="btn-primary">
              View steel water storage tanks
            </Link>
          </p>
        </SiteSection>
      </>
    );
  }

  return (
    <>
      <OrderFormViewAnalytics
        product={snapshot.product}
        quantity={snapshot.quantity}
      />
      <Hero
        compact
        eyebrow="Invoice order"
        title="Place your order"
        description="Order this fixed-price supply-only kit and receive an invoice from DamTech. Payment is made against the invoice after your order has been confirmed."
      />
      <SiteSection>
        <OrderForm snapshot={snapshot} />
      </SiteSection>
    </>
  );
}
