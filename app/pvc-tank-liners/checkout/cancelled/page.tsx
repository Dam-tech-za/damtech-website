import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SiteSection } from "@/components/SiteSection";
import { PVC_LINER_CHECKOUT_PATH } from "@/lib/shop/pvc-liners";
import { getPvcOrderForCustomer } from "@/lib/shop/pvc-orders";

export const metadata: Metadata = {
  title: { absolute: "Payment cancelled | Damtech" },
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ ref?: string; t?: string }> };

export default async function PvcCancelledPage({ searchParams }: PageProps) {
  const { ref = "", t = "" } = await searchParams;
  const order = ref && t ? await getPvcOrderForCustomer(ref.trim(), t.trim()) : null;
  const retry = order
    ? `${PVC_LINER_CHECKOUT_PATH}?sku=${encodeURIComponent(order.sku)}&qty=${order.quantity}`
    : "/pvc-tank-liners/";

  return (
    <>
      <Hero
        compact
        eyebrow="Payment"
        title="Payment cancelled"
        description="No money was taken. Your order was not placed for manufacture."
        showActions={false}
      />
      <SiteSection>
        <p>
          <Link href={retry} className="btn-primary">
            Try again
          </Link>
        </p>
        <p>Having trouble paying? Call +27 82 853 1026 or email info@dam-tech.co.za.</p>
      </SiteSection>
    </>
  );
}
